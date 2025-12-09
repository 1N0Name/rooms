Ниже — цельная «методичка» по подключению CI/CD к проекту с папками `frontend/` и `backend/`.

---

## 1. Что такое CI/CD

**CI (Continuous Integration, непрерывная интеграция)** — практика, при которой каждое изменение в репозитории автоматически проверяется: устанавливаются зависимости, запускаются тесты, линтеры и сборка. CI позволяет быстро обнаруживать ошибки, пока изменения ещё маленькие. GitHub Actions как раз предоставляет такую систему автоматизации на основе YAML-workflow.([GitHub Docs][1])

**CD (Continuous Delivery / Deployment, непрерывная поставка/развёртывание)** — практика, при которой после успешного CI новая версия автоматически разворачивается на среде: тестовой или продакшн.

В итоге получается конвейер:

> commit → CI (проверки) → CD (обновление фронтенда и backend-API на серверах)

---

## 2. Какие инструменты используются

### 2.1. GitHub Actions (CI для фронтенда и backend)

**GitHub Actions** — встроенная система автоматизации GitHub.
Основные факты:

* Конфигурация хранится в файлах `.github/workflows/*.yml`.
* Workflow состоит из **jobs**, а те — из **steps** (шагов).([GitHub Docs][2])
* Workflows запускаются по событиям: `push`, `pull_request` и др.([GitHub Docs][3])

Это используется для:

* сборки и деплоя фронта на GitHub Pages;
* прогонки тестов backend и запуска деплоя на Render.

### 2.2. GitHub Pages (хостинг фронтенда)

**GitHub Pages** — бесплатный хостинг статических сайтов прямо из репозитория. Сейчас рекомендуется использовать **деплой через GitHub Actions**, публикуя сайт из артефакта билда.([GitHub Docs][4])

Фронтенд-часть (HTML/CSS/JS, Vite/webpack и т.п.) будет собираться и публиковаться на GitHub Pages автоматически.

### 2.3. Render (хостинг backend-API с CD)

**Render** — облачный PaaS, позволяющий разворачивать web-сервисы (Node/Express и т.д.) напрямую из Git-репозитория.

Ключевые возможности, которые используются:

* **Web Services**: хостинг динамических веб-приложений, Render сам собирает и деплоит код при каждом пуше в связанную ветку.([Render][5])
* **Автодеплой из Git**: новый деплой запускается автоматически при коммите в указанную ветку.([Render][6])
* **Deploy Hooks**: специальный HTTP-URL, по которому можно инициировать деплой из внешней CI-системы (например, GitHub Actions).([Render][7])

---

## 3. Итоговая схема для проекта

Проект имеет структуру:

```text
.
├── frontend/   # клиентская часть (Vite/webpack и т.п.)
└── backend/    # API на Node/Express
```

После настройки CI/CD работа идёт так:

1. Изменения пушатся в ветку `main` репозитория на GitHub.
2. GitHub Actions запускает два workflow:

   * **Frontend CI/CD**:

     * устанавливает зависимости в `frontend/`;
     * запускает тесты/сборку;
     * публикует артефакт билда;
     * деплоит его на GitHub Pages с помощью `actions/deploy-pages`.([GitHub][8])
   * **Backend CI**:

     * устанавливает зависимости в `backend/`;
     * запускает тесты.
3. Render:

   * либо автоматически деплоит backend-сервис при каждом пуше в `main` (режим auto-deploy);([Render][6])
   * либо получает сигнал от GitHub Actions по Deploy Hook и запускает деплой только после успешного CI.([Render][7])

Фронт ходит к backend по адресу вида:

```text
https://<имя-сервиса>.onrender.com
```

---

## 4. Первичная инициализация Git-репозитория и выгрузка на GitHub

### 4.1. Настройка Git (один раз на машине)

В терминале:

```bash
git config --global user.name "Имя Фамилия"
git config --global user.email "email@example.com"
```

Команда `git config --global` задаёт имя и email автора коммитов глобально для текущей машины.([atlassian.com][9])

### 4.2. Инициализация репозитория в существующем проекте

1. Открыть терминал в корне проекта (там, где лежат папки `frontend/` и `backend/`):

   ```bash
   cd /путь/к/проекту
   ```

2. Инициализировать Git-репозиторий:

   ```bash
   git init
   ```

   Команда `git init` создаёт пустой Git-репозиторий (каталог `.git`) в текущей папке.([git-scm.com][10])

3. Добавить `.gitignore` (важно сделать это **до** первого коммита, чтобы не отслеживать лишние файлы, например `node_modules`). Например, создать файл `.gitignore` в корне:

   ```gitignore
   node_modules/
   dist/
   .DS_Store
   .env*
   ```

   Пример файла `.gitignore`:

   ```
    # === ОС/системные файлы ===
    .DS_Store
    Thumbs.db

    # === Логи ===
    logs/
    *.log
    npm-debug.log*
    yarn-debug.log*
    pnpm-debug.log*

    # === Node / зависимости ===
    node_modules/

    # === Сборка backend (TypeScript -> dist) ===
    backend/dist/

    # === Сборка frontend (Vite) ===
    frontend/dist/

    # === Prisma сгенерированный клиент ===
    backend/src/generated/prisma/

    # === Покрытие тестов (на будущее) ===
    coverage/
    .nyc_output/

    # === Файлы окружения (секреты, локальные настройки) ===
    # общий .env для docker-compose и т.п.
    .env
    # локальные/дополнительные env-файлы в поддиректориях
    **/.env
    **/.env.*

    # но допускается пример конфигурации
    !.env.example
    !**/.env.example

    # === Кэши инструментов ===
    .eslintcache

    # === TypeScript служебные файлы ===
    *.tsbuildinfo

    # === IDE / редакторы ===
    .vscode/
    .idea/
    *.swp
    *.swo
   ```

   Подход “сначала git init → потом .gitignore → git add → commit” рекомендуют и официальные руководства и практические статьи.([Stack Overflow][11])

4. Добавить файлы в индекс и сделать первый коммит:

   ```bash
   git add .
   git commit -m "Initial commit"
   ```

   Такая последовательность описывается в официальных гайдах по добавлению локального кода на GitHub.([GitHub Docs][3])

### 4.3. Создание репозитория на GitHub

1. Войти на GitHub.
2. Нажать **New repository**.
3. Ввести имя репозитория (например, `virtual-museum`).
4. **Не** создавать в веб-интерфейсе `README`, `.gitignore` и т.п. (оставить репозиторий пустым) — это упрощает push уже инициализированного локального проекта.([theserverside.com][12])
5. Нажать **Create repository** — на итоговой странице GitHub покажет подсказки по push существующего кода.

### 4.4. Привязка локального репо к GitHub и первый push

Допустим, репозиторий на GitHub имеет URL:

```text
https://github.com/<user>/<repo>.git
```

В корне проекта:

```bash
# если ветка называется main (по умолчанию в новых git версиях)
git branch -M main

git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

Типичная последовательность для уже написанного локального проекта (init → add → commit → remote add → push) полностью соответствует рекомендациям GitHub и практическим статьям.([GitHub Docs][3])

После этого:

* GitHub-репозиторий заполнен кодом;
* далее можно настраивать GitHub Actions, Pages и Render.

---

## 4. Подготовка проекта

### 4.1. Структура репозитория

Рекомендуемая структура:

```text
.
├── frontend/
│   ├── package.json
│   └── ...
├── backend/
│   ├── package.json
│   └── ...
└── .github/
    └── workflows/   # сюда будут добавлены YAML-файлы
```

### 4.2. Скрипты в `package.json`

**Фронтенд (`frontend/package.json`):**

```jsonc
{
  "scripts": {
    "build": "vite build",        // или другой сборщик
    "test": "echo \"no tests\""   // временно, если тестов нет
  }
}
```

**Backend (`backend/package.json`):**

```jsonc
{
  "scripts": {
    "start": "node index.js",     // входной файл сервера
    "test": "echo \"no tests\""
  }
}
```

Позже сюда можно добавить реальные тесты, линтер и т.д.

---

## 5. Настройка CI/CD для фронтенда (GitHub Pages)

### 5.1. Включение GitHub Pages с помощью Actions

1. Открыть репозиторий на GitHub.
2. Перейти в **Settings → Pages**.
3. В разделе **Build and deployment → Source** выбрать **GitHub Actions** — это включает механизм публикации сайта через workflow.([GitHub Docs][4])

### 5.2. Workflow для сборки и деплоя фронтенда

Создать файл `.github/workflows/frontend.yml` со следующим содержимым:

```yaml
name: Frontend CI/CD

on:
  push:
    branches: [ main ]
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend.yml'
  pull_request:
    branches: [ main ]
    paths:
      - 'frontend/**'

permissions:
  contents: read
  pages: write        # требуется для деплоя на GitHub Pages
  id-token: write     # требуется для деплоя на GitHub Pages

concurrency:
  group: "frontend-pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Install deps
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Upload artifact for Pages
        uses: actions/upload-pages-artifact@v3
        with:
          path: frontend/dist   # каталог с собранным сайтом

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Здесь используются официальные действия `upload-pages-artifact` и `deploy-pages`, рекомендованные GitHub для публикации на Pages.([GitHub][8])

**Результат:**

* При каждом пуше, затронувшем `frontend/**`, проект собирается, а артефакт деплоится на GitHub Pages.
* Адрес сайта отображается в **Settings → Pages**, а также на странице успешного запуска workflow.

---

## 6. CI для backend (GitHub Actions)

Создать файл `.github/workflows/backend-ci.yml`:

```yaml
name: Backend CI

on:
  push:
    branches: [ main ]
    paths:
      - 'backend/**'
      - '.github/workflows/backend-ci.yml'
  pull_request:
    branches: [ main ]
    paths:
      - 'backend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: backend/package-lock.json

      - name: Install deps
        run: npm ci

      - name: Run tests
        run: npm test
```

Теперь при каждом коммите/PR, затрагивающем backend, будут запускаться проверки.

Да, если переходить на Docker-сценарий, то логичнее поменять весь раздел 7 под него. Ниже — готовый переписанный блок, который можно просто вставить вместо старого **«7. CD для backend на Render»**.

---

## 7. CD для backend на Render (через Dockerfile)

### 7.0. Создание базы данных Postgres на Render

1. В панели Render выбрать **New → PostgreSQL**.
2. Задать, например:

   * **Database name**: `appdb`
   * **User**: `appuser`
3. Сохранить базу.
4. На странице созданной БД найти строку подключения — **Internal Database URL** или **External Database URL** (Render показывает готовый `postgres://user:password@host:port/db`).
5. Скопировать эту строку — она понадобится как значение переменной `DATABASE_URL` для backend-сервиса.

> В самом приложении Prisma читает строку подключения именно из `DATABASE_URL`, поэтому достаточно одной переменной, без `POSTGRES_DB/USER/PASSWORD`.

---

### 7.1. Подготовка Dockerfile backend

В директории `backend/` уже есть многостейджевый `Dockerfile`. В прод-стейдже он сейчас заканчивается так:

```dockerfile
FROM node:24-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist         ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src/generated/prisma ./dist/generated/prisma

USER node
EXPOSE 3000
CMD ["node","dist/server.js"]
```

Чтобы на Render при каждом деплое гарантированно применялись Prisma-миграции, удобнее запускать их перед стартом сервера. Для этого можно заменить последнюю строку на:

```dockerfile
CMD ["sh","-lc","npx prisma migrate deploy --schema=prisma/schema.prisma && node dist/server.js"]
```

В результате финальный прод-стейдж будет выглядеть так:

```dockerfile
FROM node:24-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist         ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src/generated/prisma ./dist/generated/prisma

USER node
EXPOSE 3000
CMD ["sh","-lc","npx prisma migrate deploy --schema=prisma/schema.prisma && node dist/server.js"]
```

Теперь при старте контейнера:

1. Выполняются миграции `prisma migrate deploy` (используют `DATABASE_URL`);
2. После успешного применения миграций запускается прод-сервер `node dist/server.js`.

---

### 7.2. Создание Docker Web Service на Render

1. Перейти на сайт Render и авторизоваться.

2. Нажать **New → Web Service**.

3. В разделе **Source** выбрать **Build and deploy from a Git repository** и подключить репозиторий с проектом (тот самый, где лежат `frontend/` и `backend/`).

4. Важные поля формы:

   * **Name** — любое осмысленное имя (например, `rooms-backend`).
   * **Region** — ближайший регион (как правило, EU).
   * **Branch** — `main` (или другая прод-ветка).
   * **Root Directory**:

     * можно оставить пустым (по умолчанию используется корень репозитория),
     * либо указать `backend`, если нужно, чтобы автодеплой триггерился только при изменениях в `backend/**`.
   * **Language / Runtime**: выбрать **Docker**.
     Render в этом случае будет строить образ по Dockerfile, а не использовать нативный Node-рантайм.

5. Нажать **Advanced** и заполнить Docker-поля:

   * **Dockerfile Path**:

     * если `Root Directory` **не задан** → `backend/Dockerfile`;
     * если `Root Directory = backend` → `Dockerfile`.
       Путь указывается согласно документации, если Dockerfile находится не в корне репозитория.
   * **Docker Build Context Directory**:

     * по умолчанию можно оставить `.` (корень репозитория) или `backend` — Render будет использовать этот каталог как контекст сборки для Docker.
   * **Docker Command** — *оставить пустым*, чтобы Render использовал `CMD` из Dockerfile (тот самый, который запускает `prisma migrate deploy` и сервер).

6. В блоке **Environment Variables** добавить переменные окружения, необходимые backend’у:

   * `DATABASE_URL` — строка подключения к базе из шага 7.0 (Internal или External URL).
   * (Опционально) `NODE_ENV=production`.

   Переменные окружения будут доступны и на этапе сборки, и во время работы контейнера.

7. В блоке **Health Check Path** указать:

   ```text
   /api/health
   ```

   Это маршрут, который уже реализован в коде и проверяет, что процесс жив и база отвечает (`SELECT 1`). Render будет периодически вызывать этот URL и на его основе определять готовность инстанса, обеспечивая zero-downtime-деплои.

8. Нажать **Create Web Service / Deploy**.
   Render загрузит репозиторий, соберёт Docker-образ по указанному Dockerfile и запустит контейнер. По завершении деплоя сервис станет доступен по адресу:

   ```text
   https://<имя-сервиса>.onrender.com
   ```

---

### 7.3. Вариант 1: Автодеплой “On Commit”

Для сервисов, которые **строят Docker-образ из Dockerfile в Git-репозитории**, Render умеет делать авто-деплой при каждом пуше в указанную ветку: на каждый новый коммит заново выполняется сборка образа и перезапуск контейнера.

1. В открытом web-сервисе на Render перейти во вкладку **Settings → Build & Deploy**.
2. Убедиться, что **Auto-Deploy** включён и стоит режим **On Commit**.

В этом режиме:

* GitHub Actions обеспечивает CI (сборка и тесты бэкенда);
* при каждом пуше в `main` Render автоматически:

  * подтягивает свежий код,
  * пересобирает Docker-образ по `backend/Dockerfile`,
  * запускает новый контейнер и проверяет `/api/health`.

---

### 7.4. Вариант 2: Deploy Hook + GitHub Actions

Если требуется, чтобы деплой происходил **только после успешного CI**, можно использовать Deploy Hook:

1. В настройках сервиса на Render открыть раздел **Deploy Hooks** и создать новый hook. Render выдаст URL вида:

   ```text
   https://api.render.com/deploy/srv-XXXX?key=YYYY
   ```

   Документация Render описывает Deploy Hooks как способ инициировать деплой одним HTTP-запросом и предлагает использовать их совместно с CI/CD (GitHub Actions, CircleCI и т.д.).

2. В репозитории GitHub открыть **Settings → Secrets and variables → Actions** и создать секрет:

   * Name: `RENDER_DEPLOY_HOOK`
   * Value: скопированный URL.

3. Создать workflow `.github/workflows/backend-deploy.yml`:

   ```yaml
   name: Backend Deploy

   on:
     push:
       branches: [ main ]
       paths:
         - 'backend/**'
         - '.github/workflows/backend-ci.yml'
         - '.github/workflows/backend-deploy.yml'

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - name: Trigger Render deploy
           run: curl -X POST "$RENDER_DEPLOY_HOOK"
           env:
             RENDER_DEPLOY_HOOK: ${{ secrets.RENDER_DEPLOY_HOOK }}
   ```

Теперь при пуше в `main`:

* сначала отрабатывает `backend-ci.yml` (тесты/линтеры);
* затем (если всё зелёное) `backend-deploy.yml` дергает Deploy Hook;
* Render запускает новый деплой: пересобирает Docker-образ и выкатывает его на прод.

---

## 8. Связь фронтенда и backend

### 8.1. Настройка URL API во фронте

Во фронте удобно вынести базовый URL API в переменную окружения (пример для Vite):

`frontend/.env.production`:

```bash
VITE_API_BASE_URL=https://<имя-сервиса>.onrender.com
```

В коде фронта:

```js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function loadExhibits() {
  const res = await fetch(`${API_BASE_URL}/api/exhibits`);
  // ...
}
```

### 8.2. CORS на backend

На стороне backend (Express):

```js
import cors from 'cors';
import express from 'express';

const app = express();

app.use(cors({
  origin: [
    'https://<user>.github.io/<repo>', // адрес GitHub Pages
  ],
}));

// далее — маршруты API
```

Такое правило разрешит запросы с адреса фронтенд-сайта.

---

## 9. Итог

После выполнения всех шагов получается полностью автоматизированная цепочка:

1. Изменения коммитятся и пушатся в GitHub.
2. GitHub Actions:

   * собирает и деплоит фронтенд на GitHub Pages;
   * прогоняет проверки backend.
3. Render деплоит обновлённый backend:

   * либо автоматически при каждой коммите в `main`,
   * либо по сигналу Deploy Hook из GitHub Actions после успешного CI.
4. Фронтенд на GitHub Pages обращается к backend-API на Render по заранее настроенному URL.

Это даёт готовый CI/CD-контур: любой новый коммит в основной ветке автоматически ведёт к обновлению как интерфейса, так и API, без ручной заливки файлов и SSH-доступа.

[1]: https://docs.github.com/actions?utm_source=chatgpt.com "GitHub Actions documentation"
[2]: https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions?utm_source=chatgpt.com "Workflow syntax for GitHub Actions"
[3]: https://docs.github.com/actions/learn-github-actions/events-that-trigger-workflows?utm_source=chatgpt.com "Events that trigger workflows"
[4]: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site?utm_source=chatgpt.com "Configuring a publishing source for your GitHub Pages site"
[5]: https://render.com/docs/web-services?utm_source=chatgpt.com "Web Services"
[6]: https://render.com/docs/deploys?utm_source=chatgpt.com "Deploying on Render"
[7]: https://render.com/docs/deploy-hooks?utm_source=chatgpt.com "Deploy Hooks"
[8]: https://github.com/actions/deploy-pages?utm_source=chatgpt.com "actions/deploy-pages"
[9]: https://render.com/docs?utm_source=chatgpt.com "Docs + Quickstarts"
