import argparse

import frida


def _parse_args():
     parser = argparse.ArgumentParser(usage="luckjwatch [options] -f target")
     parser.add_argument("-f","--file",help="target")
     parser.add_argument("-t","--type",help="watch type",choices=["svc","call"],default="call")
     parser.add_argument("-range","--range",help="watch range",choices=["jni","init_array","pthread_create"],default="init_array")
     args = parser.parse_args()
     return args
 
def on_message(message, data):
    print(message)
    # payload = message["payload"]
    # print(payload)
     
def main():
    # com.example.svcdemo1
    # print("main")
    args = _parse_args()
    
    device = frida.get_usb_device()
    pid = device.spawn(args.file)
    session = device.attach(pid)
    
    jscode = ""
    with open("../agent/_agent.js",encoding="utf-8") as f:
       jscode = f.read()
        
    script = session.create_script(jscode)
    script.on("message", on_message)

    script.load()
    script.post({
        "type": "config",
        "payload": {
            "type": args.type,
            "range": args.range
        }
    })
    device.resume(pid)
    
    try:
        input()
    except KeyboardInterrupt:
        pass    
        
if __name__ == '__main__':
    main()