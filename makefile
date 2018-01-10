ORG=$(shell echo $(CIRCLE_PROJECT_USERNAME))
BRANCH=$(shell echo $(CIRCLE_BRANCH))
NAME=$(shell echo $(CIRCLE_PROJECT_REPONAME))

# go
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
VENDOR=gvt fetch -branch $(BRANCH)

# docker
DOCKER=docker
DOCKER_BUILD=$(DOCKER) build
DOCKER_LOGIN=$(DOCKER) login
DOCKER_PUSH=$(DOCKER) push
DOCKER_FILE=dockerfile
DOCKER_FILE_ARM=Dockerfile-ARM

UNAME=$(shell echo $(DOCKER_USERNAME))
PASS=$(shell echo $(DOCKER_PASSWORD))

# angular
NPM=npm
NPM_INSTALL=$(NPM) install
NG_BUILD=ng build --prod --aot --build-optimizer
NG1=blueberry

# general
NAME := $(shell basename "$(PWD)")

build: vendor build-x86 build-arm build-web

build-x86:
	echo "building x86..."
	ls -la
	env GOOS=linux CGO_ENABLED=0 $(GOBUILD) -o $(NAME)-bin -v

build-arm: 
	env GOOS=linux GOARCH=arm $(GOBUILD) -o $(NAME)-arm -v

build-web:
	cd $(NG1) && $(NPM_INSTALL) && $(NG_BUILD) --base-href="./$(NG1)-dist/"
	mv $(NG1)/dist $(NG1)-dist

test: 
	$(GOTEST) -v -race $(go list ./... | grep -v /vendor/) 

clean: 
	$(GOCLEAN)
	rm -r $(NAME)-bin
	rm -r $(NG1)-dist

run: build-x86
	./$(NAME)-bin

vendor: 
	ifneq "$(BRANCH)" "master"
		# put vendored packages in here
		# e.g. $(VENDOR) github.com/byuoitav/event-router-microservice
	endif

docker: docker-x86 docker-arm

docker-x86: test build
	ifeq "$(BRANCH)" "master"
		$(BRANCH)="development"
	endif
	$(DOCKER_BUILD) --build-arg NAME=$(NAME) -f $(DOCKER_FILE) -t $(ORG)/$(NAME):$(BRANCH) .
	$(DOCKER_LOGIN) -u $(UNAME) -p $(PASS)
	$(DOCKER_PUSH) $(ORG)/$(NAME):$(BRANCH)
	ifeq "$(BRANCH)" "development"
		$(BRANCH)="master"
	endif

docker-arm: test build-arm
	ifeq "$(BRANCH)" "master"
		$(BRANCH)="development"
	endif
	$(DOCKER_BUILD) --build-arg NAME=$(NAME) -f $(DOCKER_FILE_ARM) -t $(GIT_ORG)/rpi-$(NAME):$(BRANCH) .
	$(DOCKER_LOGIN) -u $(DOCKER_USERNAME) -p $(DOCKER_PASSWORD)
	$(DOCKER_PUSH) $(GIT_ORG)/rpi-$(NAME):$(BRANCH)
	ifeq "$(BRANCH)" "development"
		$(BRANCH)="master"
	endif
