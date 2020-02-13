import os

frameNo = 9;

fullpath = os.path.realpath(__file__)

newpath = fullpath[0:fullpath.find(__file__)]
print(newpath)

x = 0
for file in os.listdir(newpath):
	for i in range(1,9):
		if(file.find('R'+str(i)+'')!=-1):
			print('im in')
			os.rename(newpath + file,newpath + "L" + str(i) + ".png")
	for i in range(1,9):
		if(file.find('L'+str(i)+'')!=-1):
			print('im in')
			os.rename(newpath + file,newpath + "R" + str(i) + ".png")

