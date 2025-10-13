# app.py - الملف الرئيسي للتطبيق

from flask import Flask, jsonify
from config import APP_CONFIG
from routes import routes
from questions_manager import questions_manager  # استيراد الكائن

# إنشاء تطبيق Flask
app = Flask(__name__)
app.secret_key = APP_CONFIG['SECRET_KEY']

# تسجيل الروابط
app.add_url_rule('/', 'home', routes.home)
app.add_url_rule('/api/start_game', 'start_game', routes.start_game, methods=['POST'])
app.add_url_rule('/api/get_question', 'get_question', routes.get_question)
app.add_url_rule('/api/check_answer', 'check_answer', routes.check_answer, methods=['POST'])
app.add_url_rule('/api/use_lifeline', 'use_lifeline', routes.use_lifeline, methods=['POST'])
app.add_url_rule('/api/walk_away', 'walk_away', routes.walk_away, methods=['POST'])
app.add_url_rule('/api/game_status', 'game_status', routes.game_status)
app.add_url_rule('/api/question_stats', 'get_question_stats', routes.get_question_stats)

@app.errorhandler(404)
def not_found(error):
    """معالجة الأخطاء 404"""
    return jsonify({'error': 'الصفحة غير موجودة'}), 404

@app.errorhandler(500)
def internal_error(error):
    """معالجة الأخطاء 500"""
    return jsonify({'error': 'حدث خطأ داخلي في الخادم'}), 500

if __name__ == '__main__':
    print("🚀 بدء تشغيل تطبيق من سيربح المليون...")
    print("📊 عدد الأسئلة المحملة:", len(questions_manager.all_questions))
    app.run(debug=APP_CONFIG['DEBUG'])



    