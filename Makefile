.PHONY: install run dev backend docker

install:
	npm install

run:
	$(MAKE) -j2 dev backend

dev:
	npm run dev

backend:
	npm run backend

docker:
	docker compose up -d --build --remove-orphans
