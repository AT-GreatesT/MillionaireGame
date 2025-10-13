# questions_manager.py - إدارة تحميل ومعالجة الأسئلة مع نظام الصعوبة

import json
import random
from config import APP_CONFIG, DIFFICULTY_MAP

class QuestionsManager:
    """مدير تحميل ومعالجة الأسئلة مع نظام الصعوبة"""
    
    def __init__(self):
        self.all_questions = []  # هذه السمة موجودة الآن
        self.questions_by_difficulty = {
            'easy': [],
            'medium': [],
            'hard': [],
            'very_hard': [],
            'ultimate': []
        }
        self.load_questions()
        self.categorize_questions_by_difficulty()
    
    def load_questions(self):
        """تحميل الأسئلة من ملف JSON"""
        try:
            question_file = APP_CONFIG['QUESTION_FILE']
            with open(question_file, 'r', encoding='utf-8') as f:
                self.all_questions = json.load(f)
            print(f"✅ تم تحميل {len(self.all_questions)} سؤال بنجاح.")
        except FileNotFoundError:
            print(f"❌ خطأ حرج: ملف {question_file} غير موجود.")
            self.all_questions = []
        except json.JSONDecodeError:
            print(f"❌ خطأ حرج: تنسيق JSON غير صالح في {question_file}.")
            self.all_questions = []
        except Exception as e:
            print(f"❌ خطأ غير متوقع أثناء تحميل الأسئلة: {e}")
            self.all_questions = []
    
    def categorize_questions_by_difficulty(self):
        """تصنيف الأسئلة حسب مستوى الصعوبة"""
        for question in self.all_questions:
            difficulty = question.get('difficulty', 'easy')
            if difficulty in self.questions_by_difficulty:
                self.questions_by_difficulty[difficulty].append(question)
        
        # طباعة إحصائيات الأسئلة
        for difficulty, questions in self.questions_by_difficulty.items():
            print(f"📊 مستوى {difficulty}: {len(questions)} سؤال")
    
    def get_difficulty_for_level(self, level):
        """الحصول على مستوى الصعوبة للمستوى المحدد"""
        return DIFFICULTY_MAP.get(level, 'easy')
    
    def get_question_for_level(self, level, used_questions):
        """جلب سؤال عشوائي للمستوى المطلوب مع مراعاة الصعوبة"""
        try:
            difficulty = self.get_difficulty_for_level(level)
            available_questions = self.questions_by_difficulty.get(difficulty, [])
            
            if not available_questions:
                print(f"⚠️ لا توجد أسئلة لمستوى الصعوبة: {difficulty}")
                return None
            
            # فلترة الأسئلة غير المستخدمة
            unused_questions = [
                q for q in available_questions 
                if q.get('id') not in used_questions
            ]
            
            # إذا لم توجد أسئلة غير مستخدمة، تطبيق نظام التنظيف الذكي
            if not unused_questions:
                print(f"🔄 تنظيف الأسئلة المستخدمة لمستوى {difficulty}...")
                self.cleanup_used_questions(used_questions, difficulty)
                
                # إعادة محاولة بعد التنظيف
                unused_questions = [
                    q for q in available_questions 
                    if q.get('id') not in used_questions
                ]
            
            # إذا استمر عدم وجود أسئلة، استخدام أي سؤال متاح
            if not unused_questions:
                print(f"⚠️ لا توجد أسئلة غير مستخدمة لمستوى {difficulty}، استخدام سؤال عشوائي")
                return random.choice(available_questions)
            
            return random.choice(unused_questions)
            
        except Exception as e:
            print(f"❌ خطأ في جلب سؤال للمستوى {level}: {e}")
            return None
    
    def cleanup_used_questions(self, used_questions, difficulty):
        """تنظيف الأسئلة المستخدمة عندما تصل إلى الحد الأقصى"""
        try:
            max_questions = APP_CONFIG['MAX_QUESTIONS_IN_SESSION']
            cleanup_percentage = APP_CONFIG['CLEANUP_PERCENTAGE']
            
            if len(used_questions) >= max_questions:
                # حساب عدد الأسئلة المراد إزالتها
                remove_count = int(len(used_questions) * cleanup_percentage)
                
                # إزالة أقدم الأسئلة المستخدمة
                questions_to_remove = used_questions[:remove_count]
                for question_id in questions_to_remove:
                    used_questions.remove(question_id)
                
                print(f"🧹 تم تنظيف {remove_count} سؤال من القائمة المستخدمة لمستوى {difficulty}")
            else:
                print(f"ℹ️ عدد الأسئلة المستخدمة ({len(used_questions)}) أقل من الحد الأقصى ({max_questions})")
                
        except Exception as e:
            print(f"❌ خطأ في تنظيف الأسئلة المستخدمة: {e}")
    
    def get_correct_answer_letter(self, question):
        """تحديد الحرف الصحيح للإجابة"""
        try:
            options = question.get('options', [])
            correct_answer = question.get('answer', "")
            
            for i, opt in enumerate(options):
                if opt == correct_answer:
                    return ['A', 'B', 'C', 'D'][i]
            return None
        except Exception as e:
            print(f"❌ خطأ في تحديد الحرف الصحيح: {e}")
            return None
    
    def validate_question_data(self, question):
        """التحقق من صحة بيانات السؤال"""
        try:
            required_fields = ['id', 'question', 'options', 'answer', 'difficulty']
            for field in required_fields:
                if field not in question:
                    return False
            
            if len(question['options']) != 4:
                return False
            
            if question['answer'] not in question['options']:
                return False
            
            if question['difficulty'] not in ['easy', 'medium', 'hard', 'very_hard', 'ultimate']:
                return False
            
            return True
        except Exception:
            return False
    
    def get_question_statistics(self):
        """الحصول على إحصائيات الأسئلة"""
        stats = {}
        for difficulty, questions in self.questions_by_difficulty.items():
            stats[difficulty] = len(questions)
        stats['total'] = len(self.all_questions)
        return stats

# إنشاء كائن مدير الأسئلة العالمي
questions_manager = QuestionsManager()


