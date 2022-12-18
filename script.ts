require('dotenv').config()
const superagent = require('superagent')


const QUERY_INTERVAL = 60000 // 60 sec
const TIMEOUT = 40000 // 40 sec
// const APP_URL = 'http://localhost:8910'

const makeNewSession = async (sensorId: string) => {
  const data = await superagent.post(process.env.APP_URL + '/.netlify/functions/createSession').send({sensorId, secret: process.env.SENSOR_SECRET}).then((res: Response) => {
    return res.text
  }).catch((error: any) => {
    console.error("Error making new session")
    console.error(error.response?.body)
  })
  return data ? JSON.parse(data)?.sessonId : null
}

const makeDataPoint = async (dataPoint: any) => {
    superagent.post(process.env.APP_URL + '/.netlify/functions/createDataPoint').send({...dataPoint})
    .catch((error: any) => {
      console.error("Error making data point")
      console.error(error.response?.body)})
}

const getCurrentDataPoint = async () => {
  // return {"id": "820003CB", "type": "82", "temperature": 24.45, "humidity": 48.65,
  //  "voc": 162765, "co2": 718, "ch2o": 16, "o3": 20, "pm1": 0, "pm25": 1, "pm10": 1,
    // "noise": 72.08, "uptime": 404, sessionId: '' } //example data
  const data = await superagent.get("http://192.168.4.1/j").timeout(TIMEOUT).then((res: Response) => {
    return res.text
  }).catch((error: any) => {
    console.error("Error getting data from sensor", error.response?.body)
  })
  return data ? JSON.parse(data)?.data : null
}

const querySensor = async (id: string, sessionId: string) : Promise<{ id: string; sessionId: string }> => {
    return new Promise(async (resolve, reject) => {
      try{
        const dataPoint = await getCurrentDataPoint()
        if(dataPoint){
          if(!sessionId && dataPoint.id){
            id = dataPoint.id
            sessionId = await makeNewSession(dataPoint.id)
          }
          dataPoint.sessionId = sessionId
          await makeDataPoint(dataPoint)
        }
      }
      catch(error) {console.error("Query Sensor error " + error)}
        resolve({id, sessionId})
    })
}

const main = async () => {  
    const startTime = new Date().getTime()

    const continuouslyQuerySensor = async ({id, sessionId} : {id: string, sessionId: string} = {id: '', sessionId: ''}) => {
        const fnTime = new Date().getTime();
        const result = await querySensor(id, sessionId);
        setTimeout(() => continuouslyQuerySensor(result), Math.max(QUERY_INTERVAL - (new Date().getTime() - fnTime) - ((fnTime - startTime) % QUERY_INTERVAL), 0))
    }

    continuouslyQuerySensor()
}

main()
