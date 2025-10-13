# game_session.py - إدارة حالة وجلسة اللعبة

from config import INITIAL_LIFELINES

class GameSession:
    """إدارة حالة وجلسة اللعبة"""
    
    @staticmethod
    def initialize_session(session):
        """تهيئة جلسة لعبة جديدة"""
        try:
            session.clear()
            session['current_level'] = 1
            session['score'] = 0
            session['used_questions'] = []  # قائمة تخزين IDs للأسئلة المستخدمة
            session['lifelines'] = INITIAL_LIFELINES.copy()
            session['can_walk_away'] = False
            session['questions_used_count'] = 0  # عداد الأسئلة المستخدمة
            return True
        except Exception as e:
            print(f"❌ خطأ في تهيئة الجلسة: {e}")
            return False
    
    @staticmethod
    def update_session_after_correct(session, current_level, prize_won):
        """تحديث الجلسة بعد إجابة صحيحة"""
        try:
            session['score'] = session.get('score', 0) + prize_won
            session['current_level'] = current_level + 1
            
            # تفعيل خيار الانسحاب بعد السؤال الخامس
            if current_level + 1 > 5:
                session['can_walk_away'] = True
            
            session.modified = True
            return True
        except Exception as e:
            print(f"❌ خطأ في تحديث الجلسة بعد الإجابة الصحيحة: {e}")
            return False
    
    @staticmethod
    def set_current_question(session, question, correct_letter):
        """تعيين السؤال الحالي في الجلسة"""
        try:
            session['current_question'] = {
                'id': question.get('id'),
                'question_text': question.get('question'),
                'options': question.get('options', []),
                'correct_answer': question.get('answer'),
                'difficulty': question.get('difficulty', 'easy')
            }
            session['correct_answer_letter'] = correct_letter
            session['correct_answer_text'] = question.get('answer')
            session.modified = True
            return True
        except Exception as e:
            print(f"❌ خطأ في تعيين السؤال الحالي: {e}")
            return False
    
    @staticmethod
    def add_used_question(session, question_id):
        """إضافة سؤال إلى قائمة الأسئلة المستخدمة"""
        try:
            used_questions = session.get('used_questions', [])
            
            # تجنب التكرار
            if question_id not in used_questions:
                used_questions.append(question_id)
                session['used_questions'] = used_questions
                session['questions_used_count'] = len(used_questions)
                session.modified = True
                print(f"📝 تم إضافة سؤال ID {question_id} إلى القائمة المستخدمة")
                print(f"📊 إجمالي الأسئلة المستخدمة: {session['questions_used_count']}")
            
            return True
        except Exception as e:
            print(f"❌ خطأ في إضافة سؤال مستخدم: {e}")
            return False
    
    @staticmethod
    def get_session_status(session):
        """الحصول على حالة الجلسة الحالية"""
        return {
            'current_level': session.get('current_level', 1),
            'score': session.get('score', 0),
            'lifelines': session.get('lifelines', {}),
            'can_walk_away': session.get('can_walk_away', False),
            'questions_used_count': session.get('questions_used_count', 0)
        }
    
    @staticmethod
    def clear_session(session):
        """مسح الجلسة"""
        try:
            session.clear()
            return True
        except Exception as e:
            print(f"❌ خطأ في مسح الجلسة: {e}")
            return False
    
    @staticmethod
    def get_used_questions_count(session):
        """الحصول على عدد الأسئلة المستخدمة"""
        return len(session.get('used_questions', []))
    


    