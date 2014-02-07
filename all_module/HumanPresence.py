from twisted.internet import reactor
import core.module
import core.fields
import core.fields.io
import core.fields.persistant
import time

class HumanPresenceSensor(core.module.Base):
    update_rate = 10
    class Presence(
            core.fields.sensor.Presence,
            core.fields.io.Readable,
            core.fields.Base):
        pass
