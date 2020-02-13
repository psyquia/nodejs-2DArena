import os

fullpath = os.path.realpath(__file__)

if(fullpath.find('walk') != -1):
    type = 'walk'
elif(fullpath.find('jump') != -1):
    type = 'jump'

frameNo = 9+1 if type == 'walk' else 3+1;


newpath = fullpath[0:fullpath.find(__file__)]

x = 0

if(type == 'walk'):
    for file in os.listdir(newpath):
        for i in range(1,frameNo):
            if(file.find('R'+str(i)+'%')!=-1):
                print('working: ' + str(i) + ' done...');
                os.rename(newpath + file,newpath + "L" + str(i) + ".png")
                x+=1
            elif(file.find('%') == -1):
                if(file.find('R'+ str(i)) != -1):
                    print('working: ' + str(i) + ' done...');
                    os.rename(newpath + file, newpath + 'L' + str(i) + ".png")
                    x+=1
        for i in range(1,frameNo):
            if(file.find('L'+str(i)+'%')!=-1):
                print('working: ' + str(i) + ' done...');
                os.rename(newpath + file,newpath + "R" + str(i) + ".png")
                x+=1
            elif(file.find('%') == -1):
                if(file.find('L'+ str(i)) != -1):
                    print('working: ' + str(i) + ' done...');
                    os.rename(newpath + file, newpath + 'R' + str(i) + ".png")
                    x+=1
                
elif(type == 'jump'):
    for file in os.listdir(newpath):
        for i in range(1,frameNo):
            if(file.find('j'+str(i)+'l')!=-1):
                print('working: ' + str(i) + ' done...');
                os.rename(newpath + file,newpath + "j" + str(i) + "r.png")
                x+=1
        for i in range(1,frameNo):
            if(file.find('j'+str(i)+'r')!=-1):
                print('working: ' + str(i) + ' done...');
                os.rename(newpath + file,newpath + "j" + str(i) + "l.png")
                x+=1

print('\nFINISHED: ' + str(x) + ' files renamed\n') 




