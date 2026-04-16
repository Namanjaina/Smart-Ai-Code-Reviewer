pipeline {
  agent any

  environment {
    COMPOSE_DOCKER_CLI_BUILD = '1'
    DOCKER_BUILDKIT = '1'
  }

  stages {
    stage('Backend Tests') {
      steps {
        bat 'python -m pip install --upgrade pip'
        bat 'python -m pip install -r requirements.txt'
        bat 'python -m unittest discover -s tests -q'
      }
    }

    stage('Docker Build') {
      steps {
        bat 'docker compose build'
      }
    }
  }
}