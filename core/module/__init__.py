import os
import threading
from twisted.internet import reactor
from twisted.internet.endpoints import UNIXServerEndpoint as ServerEndpoint
import core.fields
import connection

def prop_field(field):
    def _prop_field(*args, **kwargs):
        if len(args) == 1 and not kwargs:
            return field.write(*args)
        elif not args:
            if not kwargs:
                return field.read()
            if len(kwargs) == 1 and 't' in kwargs:
                return field.read(**kwargs)
            if len(kwargs) == 2 and 'fr' in kwargs and 'to' in kwargs:
                return field.read(**kwargs)
        raise Exception
    return _prop_field

def get_module_conn(module_name):
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    # sock.connect(module_name + '.sock')
    return sock

def get_network_fields(module_conn):
    request = {}
    # module_conn.send(json.dumps(request))
    # data = json.loads(module_conn.recv())
    # parse data
    return ['F2']

def prop_network_field(field):
    def _prop_network_field(*args, **kwargs):
        if len(args) == 1 and not kwargs:
            return False # write
        elif not args:
            if not kwargs:
                return None # read()
            if len(kwargs) == 1 and 't' in kwargs:
                return None # read(t=..)
            if len(kwargs) == 2 and 'fr' in kwargs and 'to' in kwargs:
                return None # read(fr=.., to=..)
        raise Exception
    return _prop_network_field

def get_module_socket(module_name):
# TODO rearrange this
    return module_name + '.sock'

class BaseMeta(type):
    ls_name = set()

    def __new__(cls, name, parents, attrs):
        return super(BaseMeta, cls).__new__(cls, name, parents, attrs)

    def __call__(self, *args, **kwargs):
        obj = super(BaseMeta, self).__call__(*args, **kwargs)
        cls = type(obj)

        # Handle module name
        if not hasattr(obj, 'module_name'):
            if not hasattr(cls, 'module_name'):
                setattr(obj, 'module_name', cls.__name__)
            else:
                setattr(obj, 'module_name', cls.module_name)

        if obj.module_name in type(self).ls_name:
            raise NameError('Module with same name already exist')
        type(self).ls_name.add(obj.module_name)

        # Handle module socket (server side)
        setattr(obj, 'module_socket', get_module_socket(obj.module_name))
        try:
          os.remove(obj.module_socket)
        except OSError:
          print 'Petite erreur en voulant supprimer', obj.module_socket
          pass
        endpoint = ServerEndpoint(reactor, obj.module_socket)
        endpoint.listen(connection.Factory(obj))

        # Handle module fields
        ls_fields = []
        for f_cls in cls.__dict__.keys():
            f_cls = getattr(cls, f_cls)
            if isinstance(f_cls, type) and issubclass(f_cls, core.fields.Base):
                field = f_cls()
                setattr(obj, field.field_name, prop_field(field))
                ls_fields += [field]
        setattr(obj, 'module_fields', ls_fields)

        return obj

class Base(threading.Thread):
    __metaclass__ = BaseMeta

    def __init__(self, **kwargs):
        super(Base, self).__init__()
        self.running = False
        self.endpoint = None

        if 'name' in kwargs:
            self.module_name = kwargs['name']
        #module_fields = []

    def start(self):
        self.running = True
        for f in self.module_fields:
            f.start()
        super(Base, self).start()

    def run(self):
        while self.running:
            pass

    def stop(self):
        for f in self.module_fields:
            f.stop()
            f.join(1)
        self.running = False

class NetworkMeta(type):
    def __new__(cls, name, parents, attrs):
        return super(NetworkMeta, cls).__new__(cls, name, parents, attrs)

    def __call__(self, *args, **kwargs):
        obj = super(NetworkMeta, self).__call__(*args, **kwargs)
        cls = type(obj)

# Gestion du nom du module
        if not hasattr(obj, 'module_name'):
            if not hasattr(cls, 'module_name'):
                setattr(obj, 'module_name', cls.__name__)
            else:
                setattr(obj, 'module_name', cls.module_name)

# Gestion de la connection au module
        conn = get_module_conn(obj.module_name)
        setattr(obj, 'module_conn', conn)

# Gestion des fields du module
        ls_field = get_network_fields(obj.module_conn)
        for field in ls_field:
            setattr(obj, field, prop_network_field(field))

        return obj

class Network(object):
    __metaclass__ = NetworkMeta

    def __init__(self, **kwargs):
        super(Network, self).__init__()

        if 'name' in kwargs:
            self.module_name = kwargs['name']

def use_module(module_name):
    return Network(name=module_name)