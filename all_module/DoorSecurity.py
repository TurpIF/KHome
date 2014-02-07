from twisted.internet import reactor
import core.module
import core.fields
import core.fields.io
import core.fields.persistant
import time

class DoorSecurity(core.module.Base):
    update_rate = 10
    doorAccess = use_module('DoorAccess')
    recognition = use_module('Recognition')
    alarmActuator = use_module('AlarmActuator')

    Security = fields.proxy.mix('Security',
    														'DoorAccess', 'Door', 
    														'Recognition', 'Recognised', 
    														'AlarmActuator', 'Alarm')
    