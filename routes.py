# routes.py - تعريف روابط وواجهات التطبيق

from flask import jsonify, request, session, render_template
from game_session import GameSession
from questions_manager import questions_manager
from lifelines_manager import lifelines_manager
from prize_system import PrizeSystem

class Routes:
    """فئة إدارة روابط التطبيق"""
    
    @staticmethod
    def home():
        """عرض صفحة اللعبة الرئيسية"""
        return render_template('index.html')
    
    @staticmethod
    def start_game():
        """تهيئة جلسة لعبة جديدة"""
        try:
            if GameSession.initialize_session(session):
                return jsonify({
                    'status': 'Game Started', 
                    'level': 1,
                    'message': 'تم بدء اللعبة بنجاح مع نظام الصعوبة المتدرج'
                })
            else:
                return jsonify({'error': 'فشل في بدء اللعبة'}), 500
        except Exception as e:
            print("❌ خطأ في بدء اللعبة:", e)
            return jsonify({"error": "حدث خطأ في بدء اللعبة"}), 500
    
    @staticmethod
    def get_question():
        """جلب سؤال عشوائي مع نظام الصعوبة"""
        try:
            current_level = session.get('current_level', 1)
            used_questions = session.get('used_questions', [])
            
            print(f"🎯 جلب سؤال للمستوى {current_level}...")
            print(f"📊 الأسئلة المستخدمة سابقاً: {len(used_questions)}")
            
            question = questions_manager.get_question_for_level(current_level, used_questions)
            if not question:
                return jsonify({"error": "لا توجد أسئلة متاحة"}), 404
            
            # إضافة السؤال إلى القائمة المستخدمة
            GameSession.add_used_question(session, question.get('id'))
            
            # تحديد الحرف الصحيح للإجابة
            correct_letter = questions_manager.get_correct_answer_letter(question)
            
            # حفظ بيانات السؤال الحالي في الجلسة
            GameSession.set_current_question(session, question, correct_letter)
            
            # تفعيل خيار الانسحاب بعد السؤال الخامس
            if current_level >= 5:
                session['can_walk_away'] = True
            
            response_data = {
                "id": question.get('id', 0),
                "level": current_level,
                "question_text": question.get('question', "سؤال غير موجود"),
                "options": question.get('options', []),
                "difficulty": question.get('difficulty', 'easy'),
                "can_walk_away": session.get('can_walk_away', False),
                "used_questions_count": GameSession.get_used_questions_count(session)
            }
            
            print(f"✅ تم جلب سؤال بنجاح - الصعوبة: {question.get('difficulty')}")
            return jsonify(response_data)
            
        except Exception as e:
            print("❌ خطأ في جلب السؤال:", e)
            return jsonify({"error": "حدث خطأ في جلب السؤال"}), 500
    
    @staticmethod
    def check_answer():
        """التحقق من صحة الإجابة"""
        try:
            data = request.get_json(silent=True)
            if not data:
                return jsonify({'error': 'تنسيق JSON غير صالح'}), 400

            player_choice = str(data.get('answer', "")).strip().upper()
            if not player_choice:
                return jsonify({'error': 'لم يتم تقديم إجابة'}), 400

            current_question = session.get('current_question')
            if not current_question:
                return jsonify({'error': 'لا يوجد سؤال نشط'}), 400

            correct_letter = session.get('correct_answer_letter')
            current_level = session.get('current_level', 1)

            if player_choice == correct_letter:
                prize_won = PrizeSystem.get_prize_value(current_level)
                
                # التحقق من فوز بالمليون
                if current_level == 15:
                    GameSession.update_session_after_correct(session, current_level, prize_won)
                    return jsonify({
                        'status': 'Game Over', 
                        'is_correct': True, 
                        'prize': prize_won, 
                        'won_million': True, 
                        'correct_answer': correct_letter,
                        'message': 'مبروك! فزت بالمليون!'
                    })
                
                # الانتقال للمستوى التالي
                if GameSession.update_session_after_correct(session, current_level, prize_won):
                    return jsonify({
                        'status': 'OK', 
                        'is_correct': True, 
                        'next_level': session['current_level'], 
                        'prize': prize_won, 
                        'correct_answer': correct_letter,
                        'message': 'إجابة صحيحة! تقدم للمستوى التالي'
                    })
                else:
                    return jsonify({'error': 'فشل في تحديث الجلسة'}), 500
            else:
                final_prize = PrizeSystem.get_safe_prize(current_level)
                GameSession.clear_session(session)
                return jsonify({
                    'status': 'Game Over', 
                    'is_correct': False, 
                    'final_prize': final_prize, 
                    'correct_answer': correct_letter,
                    'message': 'إجابة خاطئة! انتهت اللعبة'
                })
        except Exception as e:
            print("❌ خطأ في التحقق من الإجابة:", e)
            return jsonify({"error": "حدث خطأ في التحقق من الإجابة"}), 500
    
    @staticmethod
    def use_lifeline():
        """استخدام وسيلة المساعدة"""
        try:
            data = request.get_json(silent=True)
            if not data:
                return jsonify({'status': 'error', 'message': 'تنسيق JSON غير صالح.'}), 400

            lifeline_type = data.get('type')
            current_question = session.get('current_question')
            
            if not current_question:
                return jsonify({'status': 'error', 'message': 'لا يوجد سؤال نشط.'}), 404

            # التحقق من إمكانية استخدام الوسيلة
            is_valid, message = lifelines_manager.validate_lifeline_usage(session, lifeline_type)
            if not is_valid:
                return jsonify({'status': 'error', 'message': message}), 400

            # استخدام الوسيلة المحددة
            result = {}
            if lifeline_type == 'fifty_fifty':
                result = lifelines_manager.use_fifty_fifty(current_question)
            elif lifeline_type == 'ask_audience':
                result = lifelines_manager.use_ask_audience(current_question)
            elif lifeline_type == 'phone_friend':
                result = lifelines_manager.use_phone_friend(current_question)
            else:
                return jsonify({'status': 'error', 'message': 'نوع وسيلة المساعدة غير معروف.'}), 400

            # إذا نجحت الوسيلة، تعليمها كمستعملة
            if result.get('status') == 'success':
                lifelines_manager.mark_lifeline_used(session, lifeline_type)

            return jsonify(result)

        except Exception as e:
            print("❌ خطأ في استخدام وسيلة المساعدة:", e)
            return jsonify({"error": "حدث خطأ في استخدام وسيلة المساعدة"}), 500
    
    @staticmethod
    def walk_away():
        """الانسحاب من اللعبة وأخذ الجائزة الحالية"""
        try:
            if not session.get('lifelines', {}).get('walk_away', True):
                return jsonify({'status': 'error', 'message': 'وسيلة الانسحاب مستخدمة مسبقاً.'}), 400
            
            if not session.get('can_walk_away', False):
                return jsonify({'status': 'error', 'message': 'الانسحاب غير متاح بعد.'}), 400

            current_score = session.get('score', 0)
            lifelines_manager.mark_lifeline_used(session, 'walk_away')
            final_prize = current_score
            
            GameSession.clear_session(session)
            
            return jsonify({
                'status': 'Walked Away', 
                'final_prize': final_prize,
                'message': f'لقد انسحبت بمبلغ {final_prize} نقطة!'
            })
        except Exception as e:
            print("❌ خطأ في الانسحاب:", e)
            return jsonify({"error": "حدث خطأ أثناء الانسحاب"}), 500
    
    @staticmethod
    def game_status():
        """الحصول على حالة اللعبة الحالية"""
        return jsonify(GameSession.get_session_status(session))
    
    @staticmethod
    def get_question_stats():
        """الحصول على إحصائيات الأسئلة"""
        try:
            stats = questions_manager.get_question_statistics()
            return jsonify({
                'status': 'success',
                'statistics': stats,
                'used_questions': len(session.get('used_questions', [])),
                'current_difficulty': questions_manager.get_difficulty_for_level(
                    session.get('current_level', 1)
                )
            })
        except Exception as e:
            print("❌ خطأ في جلب إحصائيات الأسئلة:", e)
            return jsonify({"error": "حدث خطأ في جلب الإحصائيات"}), 500

# إنشاء كائن الروابط العالمي
routes = Routes()



