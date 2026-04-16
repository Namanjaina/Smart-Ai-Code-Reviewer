pipeline {
  agent any

  environment {
    COMPOSE_DOCKER_CLI_BUILD = '1'
    DOCKER_BUILDKIT = '1'
  }

  stages {

    stage('Create .env') {
      steps {
        bat '''
        echo DEBUG=True > .env
        echo SECRET_KEY=django-insecure-key >> .env
        echo ALLOWED_HOSTS=* >> .env
        echo OPENAI_API_KEY=your_api_key >> .env
        '''
      }
    }

    stage('Docker Build') {
      steps {
        bat 'docker compose build'
      }
    }

    stage('Backend Tests') {
      steps {
        bat 'docker compose run --rm backend python -m unittest discover -s tests -q'
      }
    }

  }
}