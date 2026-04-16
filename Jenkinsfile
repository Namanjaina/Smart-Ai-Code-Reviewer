pipeline {
  agent any

  environment {
    COMPOSE_DOCKER_CLI_BUILD = '1'
    DOCKER_BUILDKIT = '1'
  }

  stages {
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
