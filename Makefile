.PHONY: install run dev backend

install:
	npm install

run:
	$(MAKE) -j2 dev backend

dev:
	npm run dev

backend:
	npm run backend
