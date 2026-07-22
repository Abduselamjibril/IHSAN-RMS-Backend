# Production Deployment Guide: Docker Hub to VPS

This guide outlines the exact steps to build your backend Docker image, publish it to your Docker Hub repository (`ihsanrems`), and pull it on your VPS server for secure production run.

---

## Step 1: Build & Push Image to Docker Hub (From Local Machine)

Run the following commands in your local project root directory to compile, tag, and publish your image:

1. **Login to Docker Hub** in your terminal:
   ```bash
   docker login
   ```
   *(Enter your Docker Hub username `ihsanrems` and your access token or password when prompted).*

2. **Build and Tag the Backend Image**:

   * **Option A: If you are in the PROJECT ROOT directory (`C:\Users\hp\Pictures\IHSAN RMS`):**
     ```bash
     docker build -t ihsanrems/ihsan-backend:latest ./backend
     ```

   * **Option B: If you are already inside the BACKEND directory (`C:\Users\hp\Pictures\IHSAN RMS\backend`):**
     ```bash
     docker build -t ihsanrems/ihsan-backend:latest .
     ```

3. **Push the Image to Docker Hub**:
   ```bash
   docker push ihsanrems/ihsan-backend:latest
   ```

---

## Step 2: Prepare the VPS Server (On the VPS)

Create a deployment folder on your VPS (e.g., `/home/ubuntu/ihsan-rms`) and place two files inside it:

### 1. Create a Production `.env` File
Create a `.env` file containing your production passwords and keys:
```ini
# Application Config
PORT=3000
JWT_SECRET=generate_a_secure_production_secret_key
ADMIN_PASSWORD=your_production_admin_password

# Database Config (Internal container routing)
DB_HOST=postgres
DB_PORT=6666
DB_USERNAME=postgres
DB_PASSWORD=your_secure_db_password
POSTGRES_PASSWORD=your_secure_db_password
DB_DATABASE=ihsan_db

# Mailer (SMTP) Config
MAILER_HOST=smtp.gmail.com
MAILER_PORT=587
MAILER_SECURE=false
MAILER_USER=ihsanrems@gmail.com
MAILER_PASS="sqpi onlt qqpk zofm"
MAILER_FROM="Ihsan Properties <ihsanrems@gmail.com>"
```

### 2. Create the Production `docker-compose.yml` File
This version pulls the pre-built backend image from Docker Hub instead of compiling it on the VPS (which saves server CPU and RAM):

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: ihsan-postgres
    restart: always
    env_file:
      - .env
    environment:
      POSTGRES_USER: postgres
      POSTGRES_DB: ihsan_db
    command: postgres -p 6666
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    image: ihsanrems/ihsan-backend:latest
    container_name: ihsan-backend
    restart: always
    depends_on:
      - postgres
    ports:
      - "8585:3000"
    env_file:
      - .env
    environment:
      - PORT=3000
      - DB_HOST=postgres
      - DB_PORT=6666
      - DB_USERNAME=postgres
      - DB_DATABASE=ihsan_db
    volumes:
      - ./uploads:/usr/src/app/uploads

volumes:
  postgres_data:
```

---

## Step 3: Run the Application on the VPS

Once the files are created, run the following commands on your VPS terminal:

1. **Pull the latest image**:
   ```bash
   docker compose pull
   ```
2. **Start the containers** in detached background mode:
   ```bash
   docker compose up -d
   ```
3. **Verify status**:
   ```bash
   docker compose ps
   docker compose logs -f backend
   ```

Your backend API is now running securely on port **`8585`** on your VPS server!
