# VidStreamPro

VidStreamPro is a scalable, cloud‑native video sharing platform built for Microsoft Azure.  It allows
creators to upload videos with metadata and consumers to browse, watch, comment and rate them.  The
application is split into a statically hosted React frontend and a Node/Express API backend.

## Features

- **User authentication** – sign up and log in with JWTs.  Users can be consumers or creators.
- **Video upload with metadata** – creators upload MP4 files directly to Azure Blob Storage via a
  time‑limited SAS.  Metadata (title, description, publisher, genre, age rating) is stored in
  Cosmos DB.
- **Streaming and playback** – videos are streamed straight from Blob Storage with an authenticated
  URL.
- **Comments with sentiment analysis** – users can comment on videos.  The backend calls Azure
  Cognitive Services (Text Analytics) to calculate a sentiment score for each comment.
- **Rating system** – users can rate videos (1–5 stars).  Average ratings and counts are stored.
- **Creator dashboard** – creators can see their uploaded videos, edit metadata and delete them.
- **Search & filter** – consumers can search by title and filter by genre.
- **Scalability** – uses Azure Cosmos DB (serverless) for metadata, Blob Storage for video assets,
  App Service for the API and Static Web Apps for the UI.
- **CI/CD** – GitHub Actions workflows build and deploy both frontend and backend on every commit.

## Architecture

```
Browser ───────────────┐
                       │
   [Azure Static Web Apps]  (React frontend)
                       │
                       ▼
  Azure App Service (Node/Express API)
                       │
             ┌─────────┴───────────┐
             ▼                     ▼
  Azure Blob Storage      Azure Cosmos DB
  (video files)           (users/videos/comments/ratings)
                       
             ▼
  Azure Cognitive Services (Text Analytics)
  (sentiment analysis on comments)
```

## Running locally

1. Install Node.js (>=18) and npm.
2. Copy `backend/.env.example` to `backend/.env` and fill in your own credentials for Cosmos DB,
   Storage, Text Analytics and a `JWT_SECRET`.
3. In the project root run:

   ```bash
   cd backend && npm install && node server.js
   ```

4. In another terminal:

   ```bash
   cd frontend && npm install && npm start
   ```

5. The frontend will proxy API requests to `http://localhost:4000` by default (see
   `frontend/src/api.js`).

## Azure deployment

The following instructions create brand new Azure resources with unique names.  Adjust names to avoid
collisions in your subscription.

### 1. Create resource group (UK South)

```bash
RG=rg-vidstreampro-uks
LOC=uksouth
az group create -n $RG -l $LOC
```

### 2. Create storage account for video blobs

```bash
# choose a globally unique name
STG=vidprostorage$RANDOM
az storage account create -g $RG -n $STG -l $LOC --sku Standard_LRS --kind StorageV2
az storage container create --account-name $STG --name videos --auth-mode login
# fetch a key for later
STG_KEY=$(az storage account keys list -g $RG -n $STG --query "[0].value" -o tsv)
```

### 3. Create Cosmos DB (serverless) and containers

```bash
# unique name for the account
COSMOS=vidprocosmos$RANDOM
az cosmosdb create -g $RG -n $COSMOS --locations regionName=$LOC --capabilities EnableServerless
DBNAME=vidstreampro
az cosmosdb sql database create -g $RG -a $COSMOS -n $DBNAME
az cosmosdb sql container create -g $RG -a $COSMOS -d $DBNAME -n users   --partition-key-path "/id"
az cosmosdb sql container create -g $RG -a $COSMOS -d $DBNAME -n videos    --partition-key-path "/id"
az cosmosdb sql container create -g $RG -a $COSMOS -d $DBNAME -n comments  --partition-key-path "/videoId"
az cosmosdb sql container create -g $RG -a $COSMOS -d $DBNAME -n ratings   --partition-key-path "/videoId"
# capture connection info
COSMOS_ENDPOINT=$(az cosmosdb show -g $RG -n $COSMOS --query "documentEndpoint" -o tsv)
COSMOS_KEY=$(az cosmosdb keys list -g $RG -n $COSMOS --type keys --query "primaryMasterKey" -o tsv)
```

### 4. Create Cognitive Services (Text Analytics)

```bash
TEXT_RESOURCE=vidprotext$RANDOM
az cognitiveservices account create -g $RG -n $TEXT_RESOURCE -l $LOC \
  --kind TextAnalytics --sku F0 --yes
TEXT_ENDPOINT=$(az cognitiveservices account show -g $RG -n $TEXT_RESOURCE --query endpoint -o tsv)
TEXT_KEY=$(az cognitiveservices account keys list -g $RG -n $TEXT_RESOURCE --query key1 -o tsv)
```

### 5. Create App Service plan and Web App for the backend

```bash
PLAN=vidproplan$RANDOM
WEBAPP=vidproapi$RANDOM
az appservice plan create -g $RG -n $PLAN --is-linux --sku B1 --location $LOC
az webapp create -g $RG -n $WEBAPP --plan $PLAN --runtime "NODE|18-lts" --deployment-local-git

# Configure environment variables for the backend (App Service)
az webapp config appsettings set -g $RG -n $WEBAPP --settings \
  JWT_SECRET="$(openssl rand -hex 16)" \
  COSMOS_DB_ENDPOINT=$COSMOS_ENDPOINT \
  COSMOS_DB_KEY=$COSMOS_KEY \
  COSMOS_DB_DATABASE=$DBNAME \
  COSMOS_DB_USERS_CONTAINER=users \
  COSMOS_DB_VIDEOS_CONTAINER=videos \
  COSMOS_DB_COMMENTS_CONTAINER=comments \
  COSMOS_DB_RATINGS_CONTAINER=ratings \
  STORAGE_ACCOUNT_NAME=$STG \
  STORAGE_ACCOUNT_KEY=$STG_KEY \
  STORAGE_CONTAINER_NAME=videos \
  AZURE_TEXT_ANALYTICS_ENDPOINT=$TEXT_ENDPOINT \
  AZURE_TEXT_ANALYTICS_KEY=$TEXT_KEY

# Obtain publish profile (download and copy into GitHub secret)
az webapp deployment list-publishing-profiles -g $RG -n $WEBAPP -o tsv > publishProfile.xml
```

Save the contents of `publishProfile.xml` in a GitHub secret named **AZURE_WEBAPP_PUBLISH_PROFILE**.  Also
set **AZURE_WEBAPP_NAME** to the value of `$WEBAPP`.

### 6. Create Static Web App for the frontend

```bash
SWA=vidprofrontend$RANDOM
az staticwebapp create \
  -n $SWA \
  -g $RG \
  --location "West Europe" \
  --sku Free \
  --source "https://github.com/bipinnewar/vidstreampro" \
  --branch main \
  --app-location "frontend" \
  --output-location "build"
```

After creation, go to your SWA resource in the Azure portal, copy the **deployment token** and add it to your
GitHub repository secrets as **AZURE_STATIC_WEB_APPS_API_TOKEN**.

### 7. Configure the frontend to call the API

By default, the frontend expects the API at the same origin.  When deploying to Azure App Service,
set `REACT_APP_API_BASE` to your backend URL (e.g. `https://$WEBAPP.azurewebsites.net`) in GitHub
repository secrets.  The `api.js` module will read this value at build time.

In your GitHub workflow for the frontend you can inject it like so:

```yaml
  - name: Build
    run: |
      cd frontend
      npm install
      REACT_APP_API_BASE=${{ secrets.REACT_APP_API_BASE }} npm run build
```

### 8. Commit and push your code

1. Fork or create a new GitHub repository (e.g., `vidstreampro`).
2. Push the contents of this project to your repository.
3. Configure the secrets:
   - **AZURE_WEBAPP_NAME**: name of your Web App (from `$WEBAPP`).
   - **AZURE_WEBAPP_PUBLISH_PROFILE**: contents of `publishProfile.xml`.
   - **AZURE_STATIC_WEB_APPS_API_TOKEN**: deployment token from your Static Web App.
   - **REACT_APP_API_BASE** (optional): URL of your backend Web App (e.g. `https://<webapp>.azurewebsites.net`).

On every push to `main` GitHub Actions will build and deploy both the frontend and the backend.

## Extending the project

- **Thumbnails**: Integrate Azure Media Services or a video processing function to generate
  thumbnails automatically when a video is uploaded.
- **Search suggestions**: Implement full‑text search and suggestions using Azure Cognitive Search.
- **AI features**: Add transcription, language detection or key phrase extraction using Azure
  Cognitive Services.
- **Caching/CDN**: Place a CDN in front of Blob Storage for even faster video delivery.

## License

This project is provided for educational purposes as part of a coursework assignment and carries no
warranty.  Use it at your own risk.