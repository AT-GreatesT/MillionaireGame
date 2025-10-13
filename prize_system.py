# prize_system.py - نظام إدارة الجوائز والقيم

from config import PRIZE_POINTS

class PrizeSystem:
    """نظام إدارة الجوائز والنقاط الآمنة"""
    
    @staticmethod
    def get_prize_value(level):
        """جلب قيمة الجائزة للمستوى المحدد"""
        try:
            for prize in PRIZE_POINTS:
                if prize['level'] == level:
                    return prize['amount']
            return 0
        except Exception as e:
            print(f"❌ خطأ في جلب قيمة الجائزة للمستوى {level}: {e}")
            return 0
    
    @staticmethod
    def get_safe_prize(level):
        """الحصول على الجائزة الآمنة بناءً على المستوى الحالي"""
        try:
            if level <= 5:
                return 0
            elif level <= 10:
                return 1000
            else:
                return 32000
        except Exception as e:
            print(f"❌ خطأ في حساب الجائزة الآمنة للمستوى {level}: {e}")
            return 0
    
    @staticmethod
    def get_prize_for_level(level):
        """الحصول على معلومات الجائزة الكاملة للمستوى"""
        try:
            for prize in PRIZE_POINTS:
                if prize['level'] == level:
                    return prize
            return None
        except Exception as e:
            print(f"❌ خطأ في جلب معلومات الجائزة للمستوى {level}: {e}")
            return None
    
    @staticmethod
    def get_total_prizes():
        """الحصول على قائمة جميع الجوائز"""
        return PRIZE_POINTS
    


    