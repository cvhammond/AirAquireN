const superagent = require('superagent')

const QUERY_INTERVAL = 60000 // 60 sec

const { MongoClient } = require('mongodb');

const makeNewSession = async (database: any, sensorId: string) => {
  const sensors = database.collection("sensors")
  const sensor = await sensors.findOne({id: sensorId})

  const sessions = database.collection("sessions")
  const session = await sessions.insertOne({location: sensor?.currentLocation ?? "Living Room", sensorId})
  console.log(session.insertedId)

  return session.insertedId
}

const makeDataPoint = async (database: any, dataPoint: any) => {
  const dataPoints = database.collection("dataPoints")
  const newDataPoint = await dataPoints.insertOne({...dataPoint})
  console.log(newDataPoint)
  // return newDataPoint
}

const getCurrentDataPoint = () => {
  // return {text: '{"data" :{"id": "820003CB", "type": "82", "temperature": 24.45,' + 
  // ' "humidity": 48.65, "voc": 162765, "co2": 718, "ch2o": 16, "o3": 20, "pm1": 0, ' +
  // '"pm25": 1, "pm10": 1, "noise": 72.08, "uptime": 404 }}'} //example data
    let res = undefined
    while(!res){
      console.log("requesting")
      try{
        res = superagent.get("http://192.168.4.1/j").timeout(40000)
      }
      catch(error){ res = undefined}
    }
    return res
}

const querySensor = async (database: any, id: string, sessionId: number) : Promise<{ id: string; sessionId: number }> => {
    return new Promise(async (resolve, reject) => {
      try{
        const dataPoint = JSON.parse((await getCurrentDataPoint()).text)?.data
        if(dataPoint){
          if(!sessionId && dataPoint.id){
            const session = await makeNewSession(database, dataPoint.id)
            sessionId = session.id
          }
          dataPoint.sessionId = sessionId
          if(dataPoint.id){delete dataPoint.id}
          if(dataPoint.type){delete dataPoint.type}
          await makeDataPoint(database, dataPoint)
        }
      }
      catch(error) {console.error(error)}
        resolve({id, sessionId})
    })
}

const main = async () => {

  const client = new MongoClient(process.env.DATABASE_URL);
  const database = client.db("airQualitySensor")

    const startTime = new Date().getTime()

    const continuouslyQuerySensor = async ({id, sessionId} : {id: string, sessionId: number} = {id: '', sessionId: 0}) => {
        const fnTime = new Date().getTime();
        const result = await querySensor(database, id, sessionId);
        setTimeout(() => continuouslyQuerySensor(result), Math.max(QUERY_INTERVAL - (new Date().getTime() - fnTime) - ((fnTime - startTime) % QUERY_INTERVAL), 0))
    }

    continuouslyQuerySensor()
}


main()


  // const sensor = await prisma.sensor.create({
  //   data: {
  //     id: "820003CB",
  //     type: "82",
  //     currentLocation: "Outside Kitchen",
  //   }
  // })
  // console.log(sensor)