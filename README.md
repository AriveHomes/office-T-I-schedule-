# North Pointe T/I — Area-Based Schedule Schedule Dashboard

A lightweight Buildertrend-style scheduling dashboard for the North Pointe tenant improvement project.

## Architecture

- **GitHub Pages** hosts the dashboard (`index.html`, `styles.css`, `app.js`).
- **Google Sheets** is the permanent source of truth.
- **Google Apps Script** is a very small read/write bridge.
- The browser keeps a local backup, but the dashboard verifies Google Sheet saves before showing **Saved**.

## 1 — Update the Apps Script backend

Open the North Pointe Google Sheet → **Extensions → Apps Script**.

1. Open `Code.gs`.
2. Replace everything in it with `backend/Code.gs` from this package.
3. Save.
4. Go to **Deploy → Manage deployments**.
5. Edit the existing Web App deployment.
6. Choose **New version**.
7. Confirm:
   - **Execute as:** Me
   - **Who has access:** Anyone
8. Click **Deploy**.

The existing `/exec` URL can stay the same.

### Quick backend test

Open the `/exec` URL in a browser with `?action=health` added to the end. You should see a small response containing `"ok":true`.

## 2 — Create the GitHub repository

Create a blank GitHub repository named:

`north-pointe-ti-schedule`

Then upload these files to the root of the repository:

- `index.html`
- `styles.css`
- `app.js`
- `config.js`
- `README.md`

The `backend` folder can also be stored in the repo for reference, but GitHub Pages does not use it.

## 3 — Turn on GitHub Pages

In the GitHub repository:

1. **Settings → Pages**
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Branch: `main`
4. Folder: `/ (root)`
5. Click **Save**.

GitHub will show the live Pages URL after deployment.

## 4 — Connect the dashboard once

Open the GitHub Pages dashboard. Click **Connect Google Sheet** in the upper-right.

- The Apps Script URL is already prefilled.
- Paste the **API Token** from the Google Sheet → **Project Settings** tab.
- Click **Test Connection**.
- Click **Connect + Load Sheet**.

The token is saved only in that browser's local storage. It is **not** stored in GitHub.

## Daily use

Drag bars to move schedule items. Drag either end to change duration. Double-click a task to edit details. Changes save to Google Sheets and are verified before the status changes to **Saved**.

Use **Refresh** to discard the browser view and reload the current Google Sheet schedule.

## Safety

The dashboard does not edit the North Pointe drawing set or any other project file. It only reads/writes the schedule tabs in the dedicated North Pointe schedule Google Sheet.


## Area / phase colors
The dashboard now groups schedule items by physical area. Colors are controlled from the Google Sheet **Phases** tab and loaded into the dashboard automatically:
- Preconstruction / Logistics — gray
- Floor 1 Common Areas — blue
- Floor 2 Common Areas — green
- Floor 3 Common Areas — purple
- Stairs — orange
- Design Center Build-Out — teal
- 3rd Floor Arive Office Remodel — dark Arive green
- Final Closeout / Punch — charcoal

Empty areas remain visible in the Gantt as “No tasks yet” so you can add scope without losing the overall building structure.
