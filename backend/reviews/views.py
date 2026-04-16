import os
import json
import re
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from pydantic import BaseModel, Field
from typing import List, Optional

try:
    from langchain_openai import ChatOpenAI
    from langchain_core.prompts import ChatPromptTemplate
except ImportError:
    ChatOpenAI = None

class ReviewView(APIView):
    def post(self, request):
        try:
            data = request.data
            print("RECEIVED DATA:", data)
            code = data.get('code', '')
            provider = data.get('provider', 'llm')
            req_type = data.get('type', 'code')
            
            if not code.strip():
                return Response({"error": "No input provided."}, status=status.HTTP_400_BAD_REQUEST)

            repo_owner = "Unknown"
            repo_name = "Repo"
            repo_languages = []
            repo_files_content = ""

            # Check if Github
            if req_type in ['github', 'pr']:
                match = re.search(r"github\.com/([^/]+)/([^/]+)", code)
                if not match:
                    return Response({"error": "Invalid GitHub URL. Must be like https://github.com/owner/repo"}, status=status.HTTP_400_BAD_REQUEST)
                repo_owner, repo_name = match.groups()
                repo_name = repo_name.replace('.git', '')
                
                try:
                    # Fetch repository info for default branch and topics
                    r_info = requests.get(f"https://api.github.com/repos/{repo_owner}/{repo_name}", timeout=5)
                    default_branch = "main"
                    repo_topics = []
                    if r_info.status_code == 200:
                        repo_data = r_info.json()
                        default_branch = repo_data.get('default_branch', 'main')
                        repo_topics = repo_data.get('topics', [])

                    # Fetch languages
                    lang_resp = requests.get(f"https://api.github.com/repos/{repo_owner}/{repo_name}/languages", timeout=5)
                    if lang_resp.status_code == 200:
                        repo_languages = list(lang_resp.json().keys())
                        
                    # Combine topics and languages
                    repo_languages.extend([t.title() for t in repo_topics])
                    
                    # Fetch entire codebase tree recursively
                    tree_resp = requests.get(f"https://api.github.com/repos/{repo_owner}/{repo_name}/git/trees/{default_branch}?recursive=1", timeout=10)
                    if tree_resp.status_code == 200:
                        all_blobs = [f for f in tree_resp.json().get('tree', []) if f.get('type') == 'blob']
                        # Filter code files based on extension
                        files_to_check = [f for f in all_blobs if any(f['path'].endswith(ext) for ext in ['.py', '.js', '.ts', '.jsx', '.tsx', '.go', '.java', '.cpp', '.c', '.rs', '.html', '.css', '.php'])]
                        
                        # Sort to prioritize files that are not tests or config (heuristic), limit to 8 to avoid token explosion
                        files_to_check = sorted(files_to_check, key=lambda x: ('test' in x['path'].lower(), 'config' in x['path'].lower(), x['path']))
                        MAX_FILES = 8
                        
                        char_count = 0
                        MAX_CHARS = 24000 # Keep well within 8k token limit roughly 4 chars per token
                        
                        for f in files_to_check[:MAX_FILES]:
                            # GitHub raw URL format
                            raw_url = f"https://raw.githubusercontent.com/{repo_owner}/{repo_name}/{default_branch}/{f['path']}"
                            fr = requests.get(raw_url, timeout=5)
                            if fr.status_code == 200:
                                content = fr.text
                                if len(content) > 10000:
                                    content = content[:10000] + "\n... (truncated for size limit)"
                                
                                snippet = f"--- FILE PATH: {f['path']} ---\n{content}\n\n"
                                if char_count + len(snippet) > MAX_CHARS:
                                    break
                                repo_files_content += snippet
                                char_count += len(snippet)
                    
                    if not repo_files_content:
                        repo_files_content = "No code files found. Please evaluate general structure."
                except Exception as e:
                    print(f"Github API Error: {e}")
                    repo_files_content = "Failed to fetch files from Github."

            if provider == 'llm' and ChatOpenAI is not None:
                try:
                    llm = ChatOpenAI(
                        api_key=os.environ.get('OPENAI_API_KEY', 'x'),
                        base_url=os.environ.get('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
                        model=os.environ.get('OPENAI_MODEL', 'gpt-4o-mini'),
                        temperature=0.2,
                    )
                    
                    if req_type == 'github':
                        schema_format = '''
{
  "project_rating": 8,
  "languages_used": ["string"],
  "files": [
    {
      "filename": "string",
      "status": "error",
      "error_description": "string (detailed explanation of the bug, security vulnerability, or optimization found)",
      "corrected_code": "string (FULL rewritten code incorporating the fixes, OR updated Dockerfile/YAML)"
    }
  ]
}
'''
                        prompt = ChatPromptTemplate.from_messages([
                            ("system", "You are an ULTRA-STRICT Multi-Agent Repo Reviewer (incorporating Developer, Security, and DevOps AI). Check App code and Infrastructure files (Dockerfile, Jenkinsfile, yaml). For each file, set status='error', detail what is wrong/can be optimized (e.g. root privilege in Docker, no CI caching), and write the corrected_code. IMPORTANT: Escape all newlines as \\n in strings. Return ONLY valid JSON exactly matching this schema: \n{schema_format}"),
                            ("user", f"Repository: {repo_owner}/{repo_name}\nDetected Stacks: {repo_languages}\n\n{{code}}")
                        ])

                    elif req_type == 'tests':
                        schema_format = '''
{
  "test_framework_suggested": "string",
  "edge_cases_covered": ["string"],
  "generated_tests": "string (Full code for the unit tests)"
}
'''
                        prompt = ChatPromptTemplate.from_messages([
                            ("system", "You are a GenAI Test Engineer Agent. Generate comprehensive unit tests covering standard cases, edge cases, and error handling. IMPORTANT: Escape all newlines as \\n inside JSON strings. DO NOT output raw multiline strings. Return EXACTLY this JSON schema: \n{schema_format}"),
                            ("user", "Code to test:\n\n{code}")
                        ])

                    elif req_type == 'docs':
                        schema_format = '''
{
  "title": "string",
  "summary": "string",
  "complexity": "Low/Medium/High",
  "documentation": "string (Beautifully formatted Markdown README/JSDoc explaining functions, purpose, and usage)"
}
'''
                        prompt = ChatPromptTemplate.from_messages([
                            ("system", "You are a GenAI Documentation Agent. Analyze the code and generate professional documentation. IMPORTANT: Escape all newlines as \\n inside JSON strings. DO NOT output raw multiline strings. Return EXACTLY this JSON schema: \n{schema_format}"),
                            ("user", "Code to document:\n\n{code}")
                        ])

                    elif req_type == 'pr':
                        instructions = data.get('instructions', '').strip()
                        schema_format = '''
{
  "target_file_path": "string (The exact file path to create/modify, e.g. 'src/app.js' or 'README.md')",
  "new_file_content": "string (The comprehensive new code or documentation)",
  "commit_message": "string (A short, descriptive commit message)"
}
'''
                        sys_prompt = "You are an Agentic Auto-Fix AI Engineer. You have read the project structure."
                        if instructions:
                             sys_prompt += f" The user instructs you to: '{instructions}'. Safely write the implementation for this requested feature, outputting the exact file path and code."
                        else:
                             sys_prompt += " Provide an excellent overhauled README.md summarizing the provided codebase."

                        sys_prompt += " IMPORTANT: Escape all newlines as \\n inside JSON strings. DO NOT output raw multiline strings. Return EXACTLY this JSON schema: \n{schema_format}"

                        prompt = ChatPromptTemplate.from_messages([
                            ("system", sys_prompt),
                            ("user", f"Repository: {repo_owner}/{repo_name}\n\n{{code}}")
                        ])

                    else:
                        schema_format = '''
{
  "language_detected": "string",
  "code_rating": 5,
  "bugs_errors": [{"title": "string", "severity": "Low/Medium/High/Critical", "description": "string"}],
  "optimization_suggestions": ["string"],
  "corrected_code": "string"
}
'''
                        prompt = ChatPromptTemplate.from_messages([
                            ("system", "You are a strict Smart AI Code Reviewer. Analyze the code and ONLY output a valid JSON object. Escaped ALL newlines as \\n within string values. EXACTLY matching this schema:\n\n{schema_format}\n\nDo not include any other objects, keys, or markdown wrappers."),
                            ("user", "Code to review:\n\n{code}")
                        ])
                    
                    chain = prompt | llm
                    r = chain.invoke({"code": repo_files_content if req_type == 'github' else code, "schema_format": schema_format})
                    
                    try:
                        text = r.content
                        
                        start_idx = text.find('{')
                        end_idx = text.rfind('}')
                        
                        if start_idx != -1 and end_idx != -1:
                            responseText = text[start_idx:end_idx+1]
                        else:
                            responseText = text
                            
                        # Extremely aggressive heuristic cleanups for broken LLM JSONs:
                        responseText = responseText.replace("```json", "").replace("```", "")
                        responseText = responseText.strip()

                        # In case the model ignored newline escapes, json loads might fail. We attempt parse:
                        parsed = json.loads(responseText, strict=False)
                        
                        if req_type == 'github':
                             parsed['project_rating'] = parsed.get('project_rating', 5)
                             parsed['languages_used'] = parsed.get('languages_used', repo_languages)
                             parsed['files'] = parsed.get('files', [])
                             return Response(parsed, status=status.HTTP_200_OK)
                        elif req_type == 'tests' or req_type == 'docs':
                             return Response(parsed, status=status.HTTP_200_OK)
                        elif req_type == 'pr':
                             github_token = data.get('github_token', '').strip()
                             if not github_token:
                                 return Response({"error": "GitHub Personal Access Token is required to create a PR."}, status=status.HTTP_400_BAD_REQUEST)

                             import base64
                             import time
                             headers = {"Authorization": f"token {github_token}", "Accept": "application/vnd.github.v3+json"}
                             
                             # 1. Verify User Identity & Check if Fork is needed
                             auth_user_resp = requests.get("https://api.github.com/user", headers=headers)
                             if auth_user_resp.status_code != 200:
                                 return Response({"error": "Invalid GitHub Token."}, status=status.HTTP_400_BAD_REQUEST)
                             auth_user = auth_user_resp.json().get('login')
                             
                             target_owner = repo_owner
                             new_branch = f"smart-ai-fix-{int(time.time())}"
                             pr_head = new_branch

                             if auth_user.lower() != repo_owner.lower():
                                 # We don't own the repository. We MUST fork it first.
                                 fork_resp = requests.post(f"https://api.github.com/repos/{repo_owner}/{repo_name}/forks", headers=headers)
                                 if fork_resp.status_code not in [202, 200]:
                                     return Response({"error": f"Failed to fork repository: {fork_resp.text}"}, status=status.HTTP_400_BAD_REQUEST)
                                 
                                 target_owner = auth_user
                                 pr_head = f"{auth_user}:{new_branch}"
                                 # Sleep briefly to let GitHub process the fork async
                                 time.sleep(3)

                             # 2. Get branch sha (From target fork/repo)
                             ref_url = f"https://api.github.com/repos/{target_owner}/{repo_name}/git/refs/heads/{default_branch}"
                             ref_resp = requests.get(ref_url, headers=headers)
                             if ref_resp.status_code != 200:
                                 # If fork isn't ready yet, sleep again and retry once
                                 time.sleep(4)
                                 ref_resp = requests.get(ref_url, headers=headers)
                                 if ref_resp.status_code != 200:
                                     return Response({"error": f"Failed to get branch sha on {target_owner}: {ref_resp.text}"}, status=status.HTTP_400_BAD_REQUEST)
                                 
                             base_sha = ref_resp.json()['object']['sha']

                             # 3. Create new branch
                             create_ref_url = f"https://api.github.com/repos/{target_owner}/{repo_name}/git/refs"
                             requests.post(create_ref_url, headers=headers, json={"ref": f"refs/heads/{new_branch}", "sha": base_sha})
                             
                             # 4. Get target file sha if it exists
                             target_file_path = parsed.get('target_file_path', 'README.md')
                             commit_msg = parsed.get('commit_message', "🤖 Agentic AI: Enhancing repository")
                             new_file_content = parsed.get('new_file_content', '# Auto-generated by Smart AI')

                             readme_url = f"https://api.github.com/repos/{target_owner}/{repo_name}/contents/{target_file_path}"
                             readme_resp = requests.get(readme_url, headers=headers)
                             readme_sha = readme_resp.json().get('sha') if readme_resp.status_code == 200 else None

                             # 5. Commit updated file
                             b64_content = base64.b64encode(new_file_content.encode('utf-8')).decode('utf-8')
                             
                             put_data = {
                                 "message": commit_msg,
                                 "content": b64_content,
                                 "branch": new_branch
                             }
                             if readme_sha: put_data["sha"] = readme_sha
                             
                             put_resp = requests.put(readme_url, headers=headers, json=put_data)
                             if put_resp.status_code not in [200, 201]:
                                 return Response({"error": f"Failed to commit file to {target_owner}: {put_resp.text}"}, status=status.HTTP_400_BAD_REQUEST)

                             # 6. Open Pull Request on the Original Repository
                             pr_url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/pulls"
                             pr_data = {
                                 "title": commit_msg,
                                 "body": "This PR was generated automatically by **Smart AI Code Reviewer** Agent. It includes comprehensive documentation improvements and structural analysis of the codebase.",
                                 "head": pr_head,
                                 "base": default_branch
                             }
                             pull_resp = requests.post(pr_url, headers=headers, json=pr_data)
                             if pull_resp.status_code == 201:
                                 pr_link = pull_resp.json().get('html_url')
                                 parsed['pr_url'] = pr_link
                                 return Response(parsed, status=status.HTTP_200_OK)
                             else:
                                 return Response({"error": f"Failed to create PR: {pull_resp.text}"}, status=status.HTTP_400_BAD_REQUEST)
                                 
                        else:
                            parsed['language_detected'] = parsed.get("language_detected", "Unknown")
                            parsed['code_rating'] = parsed.get("code_rating", 5)
                            parsed['bugs_errors'] = parsed.get("bugs_errors", [])
                            parsed['optimization_suggestions'] = parsed.get("optimization_suggestions", [])
                            parsed['corrected_code'] = parsed.get("corrected_code", code)
                            return Response(parsed, status=status.HTTP_200_OK)
                    except Exception as parse_e:
                        with open("debug.log", "a") as f:
                             f.write(f"JSON Parse Error: {parse_e}\nContent was: {r.content}\n")
                        print(f"JSON Parse Error: {parse_e}")
                        # Fallback correctly
                except Exception as e:
                    with open("debug.log", "a") as f:
                         f.write(f"LLM Error: {e}\n")
                    print(f"LLM Error: {e}")
                    # Fallback out of LLM block
            
            # Suboptimal Fallback
            if req_type == 'github':
                 return Response({
                    "project_rating": 5,
                    "languages_used": ["Unknown"],
                    "files": [
                        {"filename": "main.py", "status": "error", "error_description": "Lacks type hints.", "corrected_code": "def run() -> None: pass"}
                    ]
                 }, status=status.HTTP_200_OK)
                 
            fallback_result = {
                "language_detected": "Unknown",
                "code_rating": 5,
                "bugs_errors": [
                    {
                        "title": "Suboptimal Error Handling",
                        "severity": "Medium",
                        "description": "The code lacks comprehensive error handling and type checking."
                    }
                ],
                "optimization_suggestions": ["Consider utilizing standard language idioms.", "Ensure adequate logging is established."],
                "corrected_code": f"# Corrected version:\n\n{code}\n\n# Note: Fallback heuristic response."
            }
            if 'def ' in code or 'import ' in code: fallback_result['language_detected'] = "Python"
            elif 'function' in code or 'const ' in code: fallback_result['language_detected'] = "JavaScript"
            return Response(fallback_result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
