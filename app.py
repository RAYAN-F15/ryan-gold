import os
import uuid
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import yt_dlp

app = Flask(__name__)
# السماح بطلبات من الواجهة الأمامية عبر CORS
CORS(app)

DOWNLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__name__)), 'downloads')
if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)

@app.route('/api/download', methods=['POST'])
def download_video():
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({'error': 'لم يتم العثور على رابط'}), 400

    url = data['url']
    
    # Generate a unique filename prefix to avoid conflicts
    file_id = str(uuid.uuid4())
    
    # إعدادات yt-dlp لتخطي الحظر
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': os.path.join(DOWNLOAD_FOLDER, f'{file_id}_%(title)s.%(ext)s'),
        'merge_output_format': 'mp4',
        'noplaylist': True,
        'quiet': False,
        'no_warnings': False,
        'extractor_args': {
            'youtube': ['player_client=web,default', 'po_token=web+']
        },
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            if not filename.endswith('.mp4'):
                base, ext = os.path.splitext(filename)
                filename = f"{base}.mp4"

            if os.path.exists(filename):
                return send_file(
                    filename,
                    as_attachment=True,
                    download_name=os.path.basename(filename)
                )
            else:
                return jsonify({'error': 'حدث خطأ أثناء حفظ الملف'}), 500

    except yt_dlp.utils.DownloadError as e:
        print(f"Download Error: {str(e)}")
        return jsonify({'error': f'رسالة خطأ من يوتيوب/المنصة: {str(e)}'}), 400
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': f'مشكلة داخلية في السيرفر: {str(e)}'}), 500

if __name__ == '__main__':
    # تشغيل السيرفر على البورت 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
