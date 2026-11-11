.PHONY: install run dev-frontend dev-backend

install:
	npm install

# Production-style run: the backend serves the built frontend on PORT (default 8787)
run:
	npm run build
	npm run backend

# Development: run these two in separate terminals, then open http://localhost:5173
dev-frontend:
	npm run dev

dev-backend:
	npm run backend
