## Kaiburr Tasks Frontend (React + Ant Design)

This is a React 19 + TypeScript + Ant Design UI for the Kaiburr Task service.

### Prerequisites
- Node.js 18+
- Backend running on `http://localhost:8082`

### Run locally
```bash
npm install
npm run dev
# open the printed URL (default http://localhost:5173)
```

Vite is configured to proxy API calls from `/api/*` to `http://localhost:8082/*` in `vite.config.ts`.

### Features
- Create task (id, name, owner, command)
- List tasks
- Search by name
- Run command for a task
- View executions and output
- Delete task

### API
The UI uses these endpoints (proxied via `/api`):
- GET `/tasks`
- GET `/tasks/{id}`
- POST `/tasks`
- DELETE `/tasks/{id}`
- GET `/tasks/search?name=foo`
- PUT `/tasks/{id}` (execute)

### UI Screenshot
![Kaiburr Tasks UI](https://github.com/Srithinreddy22/kaiburr-task3-frontend/blob/main/ui.png)




### Curl examples
```bash
# create
curl -X POST http://localhost:8082/tasks \
  -H "Content-Type: application/json" \
  -d '{"id":"123","name":"Print Hello","command":"echo Hello World!","owner":"John Smith","taskExecutions":[]}'

# list
curl http://localhost:8082/tasks

# execute
curl -X PUT http://localhost:8082/tasks/123

# search
curl "http://localhost:8082/tasks/search?name=Hello"

# delete
curl -X DELETE http://localhost:8082/tasks/123
```

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
