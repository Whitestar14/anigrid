from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import requests
from io import BytesIO
import hashlib
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Simple in-memory cache (use Redis for production)
image_cache = {}
CACHE_DIR = os.path.join(os.path.dirname(__file__), 'cache')
os.makedirs(CACHE_DIR, exist_ok=True)

@app.route('/proxy/image', methods=['GET'])
def proxy_image():
    """Fetch an image from a URL and return it with CORS headers"""
    image_url = request.args.get('url')

    if not image_url:
        return jsonify({'error': 'Missing url parameter'}), 400

    # Validate URL (basic security check)
    if not image_url.startswith(('http://', 'https://')):
        return jsonify({'error': 'Invalid URL'}), 400

    # Whitelist allowed domains
    allowed_domains = ['myanimelist.net', 's4.anilist.co', 'cdn.myanimelist.net']
    if not any(domain in image_url for domain in allowed_domains):
        return jsonify({'error': 'Domain not allowed'}), 403

    # Create cache key from URL hash
    cache_key = hashlib.md5(image_url.encode()).hexdigest()
    cache_file = os.path.join(CACHE_DIR, cache_key)

    # Return cached file if exists
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'rb') as f:
                return send_file(
                    BytesIO(f.read()),
                    mimetype='image/jpeg',
                    as_attachment=False,
                    download_name='image.jpg'
                )
        except Exception as e:
            print(f'Cache read error: {e}')

    try:
        # Fetch image from source
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(image_url, headers=headers, timeout=10)
        response.raise_for_status()

        # Cache the image
        try:
            with open(cache_file, 'wb') as f:
                f.write(response.content)
        except Exception as e:
            print(f'Cache write error: {e}')

        # Return image
        return send_file(
            BytesIO(response.content),
            mimetype=response.headers.get('content-type', 'image/jpeg'),
            as_attachment=False,
            download_name='image.jpg'
        )

    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timeout'}), 504
    except requests.exceptions.RequestException as e:
        print(f'Fetch error: {e}')
        return jsonify({'error': 'Failed to fetch image'}), 502
    except Exception as e:
        print(f'Proxy error: {e}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    # Production server uses gunicorn, this is for local development
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
