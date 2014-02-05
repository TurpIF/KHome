import json
from twisted.internet import protocol

class Protocol(protocol.Protocol):
    """
    Module specific protocol.
    TODO write guidelines for protocol.
    """
    def __init__(self, module):
        self.module = module

    def dataReceived(self, data):
        if not self.module.running:
            return

        # decode json data
        try:
            json_data = json.loads(data)
        except ValueError:
            self.err_decode_data()
            return

        if not 'code' in json_data:
            self.err_code_not_found()
            return

        # interpret protocol message
        code = str(json_data['code'])
        if code == 'get':
            self.get_value(json_data)
        elif code == 'get_at':
            self.get_at(json_data)
        elif code == 'get_from_to':
            self.get_from_to(json_data)
        elif code == 'set':
            self.set_value(json_data)
        else:
            self.err_code_not_found()

    def err(self, msg):
        """
        Main error handler, logging and outputting return status to transport.
        """
        print msg # TODO log errors *correctly*
        json.dump({ 'success': False }, self.transport)

    def err_decode_data(self):
        """
        Error handler called when received data couldn't be decoded.
        """
        self.err('Impossible to decode the received data')

    def err_code_not_found(self):
        """
        Error handler called when the query code wasn't found.
        """
        self.err('Code not found in the query')

    def err_field_error(self):
        """
        Error handler called when the queried field couldn't be found.
        """
        self.err('Field not found')

    def set_value(self, data):
        """
        Handler called to set a named field's value.
        """

        # decode the field caracteristics
        try:
            field_name = data['field_name']
            field_value = data['field_value']
        except (TypeError, KeyError):
            return self.err_decode_data()

        # set the field's value
        try:
            value = getattr(self.module, field_name)(field_value)
        except (AttributeError, IOError):
            return self.err_field_error()
        json.dump({ 'success': value }, self.transport)

    def get_value(self, data):
        """
        Handler for getting one or many fields' value(s).
        """
        try:
            fields_name = data['fields']
        except (TypeError, KeyError):
            return self.err_decode_data()

        fields_value = {}
        for field in fields_name:
            try:
                get = getattr(self.module, field)
                fields_value[field] = get()
            except (AttributeError, IOError):
                return self.err_field_error()

        json.dump({ 'success': True, 'fields': fields_value }, self.transport)

    def get_at(self, data):
        """
        Handler for getting one or many fields' value(s) at a given time.
        """
        try:
            fields_name = data['fields']
            time_at = float(data['time'])
        except (TypeError, KeyError):
            return self.err_decode_data()

        fields_value = {}
        for field in fields_name:
            try:
                fields_value[field] = getattr(self.module, field)(t=time_at)
            except (AttributeError, IOError):
                return self.err_field_error()
        json.dump({ 'success': True, 'fields': fields_value }, self.transport)

    def get_from_to(self, data):
        """
        Handler for getting one or many fields' value(s) in a certain interval.
        """
        try:
            fields_name = data['fields']
            time_from = float(data['time_from'])
            time_to = float(data['time_to'])
        except (TypeError, KeyError):
            return self.err_decode_data()

        fields_value = {}
        for field in fields_name:
            try:
                get = getattr(self.module, field)
                fields_value[field] = get(fr=time_from, to=time_to)
            except (AttributeError, IOError):
                return self.err_field_error()
        json.dump({ 'success': True, 'fields': fields_value }, self.transport)

class Factory(protocol.Factory):
    """
    Factory for the module protocol.
    """
    def __init__(self, module):
        self.module = module

    def buildProtocol(self, addr):
        return Protocol(self.module)
