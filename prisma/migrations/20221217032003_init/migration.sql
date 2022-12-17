-- CreateTable
CREATE TABLE "Sensor" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "currentLocation" TEXT NOT NULL,

    CONSTRAINT "Sensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "sensorId" TEXT NOT NULL,
    "location" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataPoint" (
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" INTEGER NOT NULL,
    "temperature" DECIMAL(4,2) NOT NULL,
    "humidity" DECIMAL(4,2) NOT NULL,
    "voc" INTEGER NOT NULL,
    "co2" INTEGER NOT NULL,
    "ch2o" INTEGER NOT NULL,
    "o3" INTEGER NOT NULL,
    "pm1" INTEGER NOT NULL,
    "pm25" INTEGER NOT NULL,
    "pm10" INTEGER NOT NULL,
    "noise" DECIMAL(4,2) NOT NULL,
    "uptime" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DataPoint_time_key" ON "DataPoint"("time");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataPoint" ADD CONSTRAINT "DataPoint_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
