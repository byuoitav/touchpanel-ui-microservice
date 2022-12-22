# vars
ORG=$(shell echo $(CIRCLE_PROJECT_USERNAME))
BRANCH=$(shell echo $(CIRCLE_BRANCH))
NAME=$(shell echo $(CIRCLE_PROJECT_REPONAME))

ifeq ($(NAME),)
NAME := $(shell basename "$(PWD)")
endif

ifeq ($(ORG),)
ORG=byuoitav
endif

ifeq ($(BRANCH),)
BRANCH:= $(shell git rev-parse --abbrev-ref HEAD)
endif

# go
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get

# docker 
DOCKER=docker
DOCKER_BUILD=$(DOCKER) build
DOCKER_LOGIN=$(DOCKER) login -u $(UNAME) -p $(PASS)
DOCKER_PUSH=$(DOCKER) push
DOCKER_FILE=dockerfile
DOCKER_FILE_ARM=dockerfile-arm

UNAME=$(shell echo $(DOCKER_USERNAME))
EMAIL=$(shell echo $(DOCKER_EMAIL))
PASS=$(shell echo $(DOCKER_PASSWORD))

# angular
NPM=npm
NPM_INSTALL=$(NPM) install
NG_BUILD=ng build --prod --aot --build-optimizer 
NG1=blueberry
NG2=cherry

build: build-x86 build-arm build-web

build-x86:
	env GOOS=linux CGO_ENABLED=0 $(GOBUILD) -o $(NAME)-bin -v

build-arm: 
	env GOOS=linux GOARCH=arm $(GOBUILD) -o $(NAME)-arm -v

build-web: $(NG1) $(NG2)
	# ng1
	cd $(NG1) && $(NPM_INSTALL) && $(NG_BUILD) --base-href="./$(NG1)/"
	mv $(NG1)/dist $(NG1)-dist
	# ng2
	cd $(NG2) && $(NPM_INSTALL) && $(NG_BUILD) --base-href="./$(NG2)/"
	mv $(NG2)/dist $(NG2)-dist

test: 
	$(GOTEST) -v -race $(go list ./... | grep -v /vendor/) 

clean: 
	$(GOCLEAN)
	rm -f $(NAME)-bin
	rm -f $(NAME)-arm
	rm -rf $(NG1)-dist
	rm -rf $(NG2)-dist

run: $(NAME)-bin $(NG2)-dist
	./$(NAME)-bin

deps:
	npm config set unsafe-perm true
	$(NPM_INSTALL) -g @angular/cli@6.0.8
	go mod tidy

docker: docker-x86 docker-arm

docker-x86: $(NAME)-bin $(NG2)-dist
ifeq "$(BRANCH)" "main"
	$(eval BRANCH=development)
endif
ifeq "$(BRANCH)" "production"
	$(eval BRANCH=latest)
endif
	$(DOCKER_BUILD) --build-arg NAME=$(NAME) -f $(DOCKER_FILE) -t $(ORG)/$(NAME):$(BRANCH) .
	@echo logging in to dockerhub...
	@$(DOCKER_LOGIN)
	$(DOCKER_PUSH) $(ORG)/$(NAME):$(BRANCH)
ifeq "$(BRANCH)" "latest"
	$(eval BRANCH=production)
endif
ifeq "$(BRANCH)" "development"
	$(eval BRANCH=main)
endif

docker-arm: $(NAME)-arm $(NG2)-dist
ifeq "$(BRANCH)" "main"
	$(eval BRANCH=development)
endif
ifeq "$(BRANCH)" "production"
	$(eval BRANCH=latest)
endif
	$(DOCKER_BUILD) --build-arg NAME=$(NAME) -f $(DOCKER_FILE_ARM) -t $(ORG)/rpi-$(NAME):$(BRANCH) .
	@echo logging in to dockerhub...
	@$(DOCKER_LOGIN)
	$(DOCKER_PUSH) $(ORG)/rpi-$(NAME):$(BRANCH)
ifeq "$(BRANCH)" "latest"
	$(eval BRANCH=production)
endif
ifeq "$(BRANCH)" "development"
	$(eval BRANCH=main)
endif

### deps
$(NAME)-bin:
	$(MAKE) build-x86

$(NAME)-arm:
	$(MAKE) build-arm

$(NG1)-dist $(NG2)-dist:
	$(MAKE) build-web
