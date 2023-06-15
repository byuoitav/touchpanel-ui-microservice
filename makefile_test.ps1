Write-Output "Logging into Github package repository"
# $Username = $Env:DOCKER_USERNAME #Get-Item =Path env:DOCKER_USERNAME
# $Password = $Env:DOCKER_PASSWORD #Get-Item =Path env:DOCKER_PASSWORD
$DOCKER_URL = "docker.pkg.github.com"

Write-Output "Logging into repo"    
Invoke-Expression "docker login $DOCKER_URL -u $Env:DOCKER_USERNAME -p $Env:DOCKER_PASSWORD"

if ($COMMIT_HASH -eq $TAG) {
        Write-Output "Pushing dev containers with tag $COMMIT_HASH"

        Write-Output "Pushing container $DOCKER_PKG/$NAME-dev:$COMMIT_HASH"
        Invoke-Expression "docker push $DOCKER_PKG/$NAME-dev:$COMMIT_HASH"
    } elseif ($TAG -match $DEV_TAG_REGEX) {
        Write-Output "Pushing dev containers with tag $TAG"

    	Write-Output "Pushing container $DOCKER_PKG/$NAME-dev:$TAG"
    	Invoke-Expression "docker push $DOCKER_PKG/$NAME-dev:$COMMIT_HASH"
    } elseif ($TAG -match $PRD_TAG_REGEX) {
        Write-Output "Pushing prd containers with tag $TAG"

    	Write-Output "Pushing container $DOCKER_PKG/${NAME}:$TAG"
    	Invoke-Expression "docker push $DOCKER_PKG/${NAME}:$COMMIT_HASH"
    } else {
        Write-Output "Deploy function quit unexpectedly. Commit Hash: $COMMIT_HASH     Tag: $TAG"
    }