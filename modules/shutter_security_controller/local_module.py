import module
from module import use_module
import fields

class ShutterController(module.Base)
    shutter= use_module('Shutter')
    temp = use_module('Temperature')
        
    class controller(fields.Base):

        def _init_:
            super(ShutterController.controller, self)._init_
        
        def always(self):
            if self.module.presence.presence():
                self.module.light.light_button(True)
            else:
                self.module.light.light_button(False)
        
        
    #code du main a remettre lais il était chelou donc pr le moment je l'ai vire...
