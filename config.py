# config.py - الإعدادات والثوابت العامة

import os

# إعدادات التطبيق
APP_CONFIG = {
    'SECRET_KEY': 'super_secret_millionaire_key',
    'DEBUG': True,
    'QUESTION_FILE': 'questions.json',
    'MAX_QUESTIONS_IN_SESSION': 500,  # 50% من 1000 سؤال
    'CLEANUP_PERCENTAGE': 0.3  # 30% من الأسئلة المستخدمة
}

# قائمة الجوائز والنقاط الآمنة
PRIZE_POINTS = [
    {'level': 1, 'amount': 100, 'is_safe': False, 'difficulty': 'easy'},
    {'level': 2, 'amount': 200, 'is_safe': False, 'difficulty': 'easy'},
    {'level': 3, 'amount': 300, 'is_safe': False, 'difficulty': 'easy'},
    {'level': 4, 'amount': 500, 'is_safe': False, 'difficulty': 'easy'},
    {'level': 5, 'amount': 1000, 'is_safe': True, 'difficulty': 'medium'},
    {'level': 6, 'amount': 2000, 'is_safe': False, 'difficulty': 'medium'},
    {'level': 7, 'amount': 4000, 'is_safe': False, 'difficulty': 'medium'},
    {'level': 8, 'amount': 8000, 'is_safe': False, 'difficulty': 'medium'},
    {'level': 9, 'amount': 16000, 'is_safe': False, 'difficulty': 'hard'},
    {'level': 10, 'amount': 32000, 'is_safe': True, 'difficulty': 'hard'},
    {'level': 11, 'amount': 64000, 'is_safe': False, 'difficulty': 'hard'},
    {'level': 12, 'amount': 125000, 'is_safe': False, 'difficulty': 'very_hard'},
    {'level': 13, 'amount': 250000, 'is_safe': False, 'difficulty': 'very_hard'},
    {'level': 14, 'amount': 500000, 'is_safe': False, 'difficulty': 'very_hard'},
    {'level': 15, 'amount': 1000000, 'is_safe': False, 'difficulty': 'ultimate'}
]

# حالات وسائل المساعدة الابتدائية
INITIAL_LIFELINES = {
    'fifty_fifty': True,
    'ask_audience': True,
    'phone_friend': True,
    'walk_away': True
}

# خريطة المستويات للصعوبة
DIFFICULTY_MAP = {
    1: 'easy', 2: 'easy', 3: 'easy', 4: 'medium',
    5: 'medium', 6: 'medium', 7: 'medium', 8: 'hard',
    9: 'hard', 10: 'hard', 11: 'hard',
    12: 'very_hard', 13: 'very_hard', 14: 'ultimate',
    15: 'ultimate'
}



