import module
from module import use_module
import fields

class MoistureReducing(module.Base):
    moisture_sensor = use_module('MoistureSensor')
    fan_actuator = use_module('FanActuator')

    class moisture_value_limit(fields.Percentage, fields.Writable,
            fields.Base):
        pass

    class controller(fields.Base):
        update_rate = 60 # update every minute

        def __init__(self):
            self.moisture_value_limit = 45 # moisture limit as a percentage
            super(MoistureController.controller, self).__init__()

        def always(self):
            """
            Reduce the moisture by checking the moisture level. If this one is over the
            """
            try:
                moisture_value = self.module.moisture_sensor.moisture()
            except TypeError as e: # FIXME why TypeError ?
                self.logger.exception(e)
            else:
                if moisture_value > self.moisture_value_limit:
                    self.module.fan_actuator.fan(True)
                    self.logger.info('moisture (%s%) over limit, running fan',
                            moisture_value)
                else:
                    self.module.fan_actuator.fan(False)
                    self.logger.info('moisture (%s%) under limit, stopping fan',
                            moisture_value)