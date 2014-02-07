import module
import fields
import fields.io
import fields.actuator

class AlarmActuator(module.Base):
    update_rate = 10

    class Alarm(fields.actuator.Alarm, fields.io.Writable, fields.Base):
        pass
