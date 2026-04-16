pipeline {
  agent any

  environment {
    COMPOSE_DOCKER_CLI_BUILD = '1'
    DOCKER_BUILDKIT = '1'
  }

  stages {
    stage('Backend Tests') {
      steps {
        sh 'python -m pip install --upgrade pip'
        sh 'python -m pip install -r requirements.txt'
        sh 'python -m unittest discover -s tests -q'
      }
    }

    stage('Docker Build') {
      steps {
        sh 'docker compose build'
      }
    }
  }
}
