# CLI Management Guide: Vercel & MongoDB Atlas

This guide provides the essential commands you'll need to manage your production infrastructure directly from your terminal.

## 1. 🔼 Vercel CLI (Frontend Management)
The Vercel CLI allows you to deploy, manage environment variables, and configure your global settings.

### Common Commands:
*   **`vercel login`**: Authenticates your terminal with your Vercel account.
*   **`vercel deploy`**: Deploys a preview version of your `client` folder.
*   **`vercel deploy --prod`**: The "Go Live" command. Deploys to your production domain.
*   **`vercel env add <key> <value>`**: Quickly adds a new environment variable (e.g., `VITE_MAPBOX_TOKEN`) to your project.
*   **`vercel logs`**: Streams live traffic logs from your production website so you can see user visits in real-time.

---

## 2. 🍃 MongoDB Atlas CLI (Database Management)
Use the `atlas` command to manage your clusters, check database health, and create database users without opening a browser.

### Common Commands:
*   **`atlas auth login`**: Logs you into your MongoDB Atlas account.
*   **`atlas clusters list`**: View all your running databases and their current health.
*   **`atlas dbusers create`**: Add a new database user for your server to connect as.
*   **`atlas metrics <cluster-name>`**: View live CPU and Memory usage for your database (very useful for your project presentation!).

---

## 🛠️ The "Pro-Level" Shortcut
If you want to deploy your **entire** project from only the command line, this is the recommended workflow:

1.  **Navigate to the Client Folder:** `cd client`
2.  **Deploy to Production:** `vercel deploy --prod`
3.  **Sync your Backend:** If you move your backend to production (e.g., Railway), use the CLI to update your `VITE_API_BASE_URL` in Vercel:
    `vercel env add VITE_API_BASE_URL https://your-new-backend.com/api`

> [!TIP]
> **Why use the CLI?** For your college project, showing your markers that you managed your deployment via terminal instead of just "clicking buttons" in a dashboard shows a much higher level of technical maturity!
