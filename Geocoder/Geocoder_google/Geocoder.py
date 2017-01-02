import googlemaps


def writeMyLine(coords, new_file, line, counter):
    line = line[:-1]
    templine = line + '\t' + \
        str(coords['lng']) + "\t" + str(coords['lat']) + "\n"
    print(str(counter) + ": " + templine[:-1])
    new_file.write(templine)
    return


def getAllKeys():
    L = []
    with open("./key.txt", "r") as keylist:
        for line in keylist:
            currentLine = line.split("\t")[0]
            try:
                gmaps = googlemaps.Client(key=currentLine)
                gmaps.geocode("Regensburg, Germany")
                L.append(currentLine)
            except:
                print("key " + currentLine + " not working... skipping")
                continue

    if len(L) > 0:
        print(str(len(L)) + " keys Working")
    else:
        exit()
    return L


def getNewClient(k):
    if(len(k) > 0):
        print("Using next key")
        return googlemaps.Client(key=k.pop())
    else:
        inp = input("No more Keys. Enter new Key")
        if inp == "exit":
            exit()
        else:
            return googlemaps.Client(key=inp)
    return None


def main():

    keys = getAllKeys()
    gmaps = getNewClient(keys)

    counter = 0
    for i in range(2, 6):
        pathSimple = "D:/Spatial/Data/CSV/Rental_Data/CSV/simple/b" + \
            str(i) + "_condo_comp012816.txt"
        pathReworked = "D:/Spatial/Data/CSV/Rental_Data/CSV/reworked_google/b" + \
            str(i) + "_reworked.txt"
        pathLogg = "D:/Spatial/Data/CSV/Rental_Data/CSV/reworked_google/log.txt"
        print("Next File")
        with open(pathSimple, 'r') as old_file:
            with open(pathReworked, 'w') as new_file:
                for line in old_file:
                    splited = line.split("\t")
                    try:
                        response = gmaps.geocode(
                            splited[0] + ", " + splited[1] + ", New York")
                    except:
                        gmaps = getNewClient(keys)
                        counter = 0
                    if len(response) > 0:
                        coords = response[0]['geometry']['location']
                        writeMyLine(coords, new_file, line, counter)
                    else:
                        with open(pathLogg, "a") as logger:
                            logger.write(line)
                    counter += 1
                    if counter > 2399:
                        gmaps = getNewClient(keys)
                        counter = 0
    print("Finished")

if __name__ == '__main__':
    main()
