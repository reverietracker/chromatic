instruments = {}

function BOOT()
 cls()
 for inst=1,4 do
  for note=0,24 do
   rect(note*10,inst*20,8,18,inst)
  end
 end
end

frame=0
instrument=0
freq=440

function TIC()
 local x,y,l,m,r,sx,sy=mouse()

 if l then
  if frame==0 then
   instindex=(y-2)//20
   if instindex<1 or instindex>4 then
    return
   end
   instrument=instruments[instindex]
   freq=(440*2^(((x//10)-16)/12))//1
  end
  instrument(1,15,freq,frame)
  frame=frame+1
 else
  poke(0xff9c,0)
  poke(0xff9d,0)
  frame=0
 end
end
