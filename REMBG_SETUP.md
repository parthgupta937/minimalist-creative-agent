# Rembg Background Removal Setup

This guide explains how to set up and use Rembg for automatic background removal in the ad generator.

## Prerequisites

- Python 3.11 or later
- pip (Python package manager)
- Node.js (for running the Next.js app)

## Installation

### Step 1: Install Rembg and dependencies

```bash
# Create a virtual environment (recommended)
python3 -m venv rembg-env
source rembg-env/bin/activate  # On Windows: rembg-env\Scripts\activate

# Install Rembg and Flask
pip install rembg flask requests pillow
```

### Step 2: Start the Rembg server

In a separate terminal (with the virtual environment activated):

```bash
python3 rembg-server.py
```

You should see:
```
Starting Rembg server on http://localhost:5000
POST to /remove-bg with 'image_url' or 'file' parameter
GET /health to check server status
```

The Rembg models will download automatically on first run (~300MB) and be cached in `~/.rembg/models/`.

### Step 3: Start the Next.js app

In another terminal:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Usage

1. Extract or enter product data as normal (URL fetch, paste, or manual entry)
2. In the review step, look for the **"Remove image background"** section
3. Check the **"Remove image background"** checkbox
4. Click **"Process background removal"**
5. The product image URL will be updated with a transparent-background version
6. Generate the creative as normal

## How It Works

1. **Rembg server** runs locally on port 5000 and uses deep learning to detect and remove backgrounds
2. **API route** (`/api/remove-background`) sends the image URL to Rembg
3. **Processed image** is returned as a base64 data URL and replaces the original
4. **Creative rendering** uses the new transparent-background image

## Features

- **Completely free** - No API costs, runs locally
- **Offline** - Your images never leave your computer
- **Fast** - Processes images in seconds
- **Accurate** - Uses U-Net and BiRefNet deep learning models
- **Optional** - Background removal is completely optional; you can use the tool without it

## Troubleshooting

### "Rembg server is not available"

Make sure the Rembg server is running:
```bash
python3 rembg-server.py
```

### Server is running but processing fails

Check that:
- The image URL is accessible and returns a valid image
- The image format is supported (PNG, JPG, etc.)
- The server has internet access (only needed for first model download)

### Slow first run

The first time you use Rembg, it downloads pre-trained models (~300MB). Subsequent runs are much faster.

### GPU acceleration (optional)

For faster processing with an NVIDIA GPU:

```bash
pip install rembg[gpu]
```

Then restart the server.

## Customization

To use a different Rembg model, edit `rembg-server.py` and modify the `remove()` call:

```python
output_image = remove(input_image, model_name='u2netp')  # Lightweight version
output_image = remove(input_image, model_name='isnet-general-use')  # Faster
```

Available models: `u2net`, `u2netp`, `u2net_human_seg`, `u2net_cloth_seg`, `isnet-general-use`, `isnet-anime`

## Architecture

```
Next.js App (http://localhost:3000)
    ↓
/api/remove-background route
    ↓
Rembg HTTP Server (http://localhost:5000)
    ↓
Deep learning model (U-Net/BiRefNet)
    ↓
Background-removed PNG (transparent)
    ↓
Base64 data URL (stored in form)
    ↓
Creative render
```
