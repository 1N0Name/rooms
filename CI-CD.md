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

---

## 7. CD для backend на Render

### 7.1. Создание сервиса на Render

1. Перейти на сайт Render и авторизоваться.

2. Выбрать **New → Web Service**.([Render][9])

3. Подключить GitHub-репозиторий проекта.

4. Настроить параметры:

   * **Branch**: `main` (или другая прод-ветка).
   * **Root Directory**: `backend` (Render будет считать корнем папку backend).([Render][5])
   * **Build Command**: `npm ci`
   * **Start Command**: `npm start`
   * Выбрать подходящий регион (как правило, EU).

5. Сохранить настройки и создать сервис. Render выполнит initial deploy: клонирует репозиторий, выполнит build/start и поднимет сервис по URL вида:

   `https://<имя-сервиса>.onrender.com`

Согласно документации, Render автоматически пересобирает и деплоит web-сервисы при новых пушах в связанную ветку.([Render][5])

### 7.2. Вариант 1: Автодеплой “On Commit”

В настройках сервиса на Render есть режим авто-деплоя из Git.

* В интерфейсе Render включается опция автоматического деплоя при каждом коммите (auto-deploy).([Render][6])

В этом случае:

* GitHub Actions отвечают только за CI (тесты),
* Render самостоятельно деплоит backend при пуше в `main`.

### 7.3. Вариант 2: Deploy Hook + GitHub Actions

Чтобы деплой запускался **только после успешного CI**, можно использовать Deploy Hooks.

**Шаги:**

1. В настройках сервиса на Render открыть раздел **Deploy Hooks** и создать новый hook. Render выдаст URL вида:

   `https://api.render.com/deploy/srv-XXXX?key=YYYY`

   Документация Render описывает deploy hooks как способ инициировать деплой одним HTTP-запросом и прямо предлагает использовать их совместно с CI/CD средами, такими как GitHub Actions.([Render][7])

2. На GitHub в репозитории открыть **Settings → Secrets and variables → Actions** и создать секрет:

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

При пуше в `main` этот workflow дергает Deploy Hook, и Render начинает деплой последнего коммита.([Render][7])

При необходимости можно усложнить схему: сделать так, чтобы деплой выполнялся только после успешного выполнения `backend-ci.yml` (например, разделив workflow на два и используя статусы предыдущего).

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
