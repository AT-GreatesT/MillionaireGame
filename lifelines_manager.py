# lifelines_manager.py - إدارة وسائل المساعدة

import random

class LifelinesManager:
    """مدير وسائل المساعدة"""
    
    @staticmethod
    def validate_lifeline_usage(session, lifeline_type):
        """التحقق من إمكانية استخدام وسيلة المساعدة"""
        try:
            lifelines = session.get('lifelines', {})
            
            if lifeline_type not in lifelines:
                return False, "نوع وسيلة المساعدة غير صالح"
            
            if not lifelines[lifeline_type]:
                return False, f"وسيلة {lifeline_type} مستخدمة مسبقاً"
            
            return True, "وسيلة المساعدة متاحة"
        except Exception as e:
            print(f"❌ خطأ في التحقق من وسيلة المساعدة: {e}")
            return False, "حدث خطأ في التحقق من وسيلة المساعدة"
    
    @staticmethod
    def mark_lifeline_used(session, lifeline_type):
        """تعليم وسيلة المساعدة كمستعملة"""
        try:
            session['lifelines'][lifeline_type] = False
            session.modified = True
            return True
        except Exception as e:
            print(f"❌ خطأ في تعليم وسيلة المساعدة كمستعملة: {e}")
            return False
    
    @staticmethod
    def use_fifty_fifty(current_question):
        """استخدام وسيلة 50:50"""
        try:
            options = current_question.get('options', [])
            correct_answer_text = current_question.get('correct_answer')
            
            incorrect_options = [opt for opt in options if opt != correct_answer_text]
            
            if len(incorrect_options) >= 2:
                options_to_remove = random.sample(incorrect_options, 2)
            else:
                options_to_remove = incorrect_options

            return {
                'status': 'success',
                'type': 'fifty_fifty',
                'options_to_remove': options_to_remove
            }
        except Exception as e:
            print(f"❌ خطأ في استخدام 50:50: {e}")
            return {'status': 'error', 'message': 'فشل في استخدام 50:50'}
    
    @staticmethod
    def use_ask_audience(current_question):
        """استخدام وسيلة سؤال الجمهور"""
        try:
            options = current_question.get('options', [])
            correct_answer_text = current_question.get('correct_answer')
            
            percentages = [0] * len(options)
            
            correct_index = -1
            for i, opt in enumerate(options):
                if opt == correct_answer_text:
                    correct_index = i
                    break
            
            if correct_index != -1:
                # إعطاء نسبة عالية للإجابة الصحيحة
                base_percentage = random.randint(70, 85)
                percentages[correct_index] = base_percentage
                remaining_percentage = 100 - base_percentage
                
                incorrect_indices = [i for i in range(len(options)) if i != correct_index]
                if incorrect_indices:
                    weights = [random.randint(1, 10) for _ in incorrect_indices]
                    total_weights = sum(weights)
                    
                    for i, idx in enumerate(incorrect_indices):
                        percentages[idx] = int((weights[i] / total_weights) * remaining_percentage)
                    
                    # تعديل النسب لضمان أن المجموع 100%
                    total = sum(percentages)
                    if total != 100:
                        percentages[correct_index] += 100 - total

            audience_votes = {opt: percentages[i] for i, opt in enumerate(options)}
            
            return {
                'status': 'success',
                'type': 'ask_audience',
                'result': audience_votes
            }
        except Exception as e:
            print(f"❌ خطأ في استخدام سؤال الجمهور: {e}")
            return {'status': 'error', 'message': 'فشل في استخدام سؤال الجمهور'}
    
    @staticmethod
    def use_phone_friend(current_question):
        """استخدام وسيلة الاتصال بصديق"""
        try:
            options = current_question.get('options', [])
            correct_answer_text = current_question.get('correct_answer')
            
            if random.random() < 0.8:
                friend_answer = correct_answer_text
                friend_confidence = random.randint(75, 95)
            else:
                incorrect_options = [opt for opt in options if opt != correct_answer_text]
                if incorrect_options:
                    friend_answer = random.choice(incorrect_options)
                    friend_confidence = random.randint(30, 60)
                else:
                    friend_answer = correct_answer_text
                    friend_confidence = random.randint(75, 95)

            return {
                'status': 'success',
                'type': 'phone_friend',
                'result': friend_answer,
                'confidence': f"{friend_confidence}%",
                'message': f"صديقك يعتقد أن الإجابة هي: {friend_answer} (ثقة: {friend_confidence}%)"
            }
        except Exception as e:
            print(f"❌ خطأ في استخدام الاتصال بصديق: {e}")
            return {'status': 'error', 'message': 'فشل في استخدام الاتصال بصديق'}

# إنشاء كائن مدير وسائل المساعدة العالمي
lifelines_manager = LifelinesManager()


