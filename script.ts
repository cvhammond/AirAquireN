import { Prisma, PrismaClient } from '@prisma/client'

const superagent = require('superagent')
const prisma = new PrismaClient()

const QUERY_INTERVAL = 60000 // 60 sec

const makeNewSession = async (sensorId: string) => {
  const sensor = await prisma.sensor.findFirstOrThrow({
    where: {id: sensorId}
  })
  const session = await prisma.session.create({
    data: {
      sensorId: sensorId,
      location: sensor.currentLocation
    }
  })
  return session
}

const makeDataPoint = async (dataPoint: Prisma.DataPointCreateInput) => {
  return await prisma.dataPoint.create({
    data: {
      ...dataPoint
    }
  })
}

const getCurrentDataPoint = () => {
  // return {text: '{"data" :{"id": "820003CB", "type": "82", "temperature": 24.45,' + 
  // ' "humidity": 48.65, "voc": 162765, "co2": 718, "ch2o": 16, "o3": 20, "pm1": 0, ' +
  // '"pm25": 1, "pm10": 1, "noise": 72.08, "uptime": 404 }}'} //example data
    let res = undefined
    while(!res){
      console.log("requesting")
      try{
        res = superagent.get("http://192.168.4.1/j").timeout(5000)
      }
      catch(error){ res = undefined}
    }
    return res
}

const querySensor = async (id: string, sessionId: number) : Promise<{ id: string; sessionId: number }> => {
    return new Promise(async (resolve, reject) => {
      try{
        const dataPoint = JSON.parse((await getCurrentDataPoint()).text)?.data
        console.log(dataPoint)
        // if(dataPoint){
        //   if(!sessionId && dataPoint.id){
        //     const session = await makeNewSession(dataPoint.id)
        //     sessionId = session.id
        //   }
        //   dataPoint.sessionId = sessionId
        //   if(dataPoint.id){delete dataPoint.id}
        //   if(dataPoint.type){delete dataPoint.type}
        //   await makeDataPoint(dataPoint)
        // }
      }
      catch(error) {console.error(error)}
        resolve({id, sessionId})
    })
}

const main = async () => {  
    const startTime = new Date().getTime()

    const continuouslyQuerySensor = async ({id, sessionId} : {id: string, sessionId: number} = {id: '', sessionId: 0}) => {
        const fnTime = new Date().getTime();
        const result = await querySensor(id, sessionId);
        setTimeout(() => continuouslyQuerySensor(result), Math.max(QUERY_INTERVAL - (new Date().getTime() - fnTime) - ((fnTime - startTime) % QUERY_INTERVAL), 0))
    }

    continuouslyQuerySensor()
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })


  // const sensor = await prisma.sensor.create({
  //   data: {
  //     id: "820003CB",
  //     type: "82",
  //     currentLocation: "Outside Kitchen",
  //   }
  // })

  // console.log(sensor)