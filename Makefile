.PHONY: install run dev backend

install:
	npm install

# Vite (dev server) and the API backend (PORT, default 8787) both block,
# so run them as parallel make jobs; Vite proxies /api to the backend.
run:
	$(MAKE) -j2 dev backend

dev:
	npm run dev

backend:
	npm run backend
