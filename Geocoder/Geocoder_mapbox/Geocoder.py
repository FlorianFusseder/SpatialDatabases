import os
os.environ["MAPBOX_ACCESS_TOKEN"] = "pk.eyJ1IjoicmVpaXNlciIsImEiOiJjaXZocjFrYXgwMDVtMm9wazI0Z3VxcTZ0In0.N-5liEt2D240DCjS2oJaZA"

from mapbox import Geocoder
import time

def WriteMyLine(first, new_file, line):
	coords = first['geometry']['coordinates']
	line = line[:-1]
	templine = line + '\t' + str(coords[0]) + "\t" + str(coords[1]) + "\n"
	print(templine)
	new_file.write(templine)
	return

def main():

	geocoder = Geocoder()
	
	for i in range(1, 6):
		pathSimple = "D:/Spatial/Data/CSV/Rental_Data/CSV/simple/b" + str(i) + "_condo_comp012816.txt"
		pathReworked = "D:/Spatial/Data/CSV/Rental_Data/CSV/reworked_mapbox/b" + str(i) + "_reworked.txt"
		with open(pathSimple, 'r') as old_file:
			with open(pathReworked, 'w') as new_file:
				for line in old_file:
					temp = line.split("\t")
					temp = temp[0] + ", " + " New York"
					response = geocoder.forward(temp, lon=-73.935242, lat=40.730610)
					first = response.geojson()['features'][0]
					if response.status_code == 200:
						WriteMyLine(first, new_file, line)
					else:
						print(response.status_code + " -> warten")
						time.sleep(65)
						response = geocoder.forward(temp, lon=-73.935242, lat=40.730610)
						if response.status_code == 200:
							first = response.geojson()['features'][0]
							WriteMyLine(first, new_file, line)
							print("geklappt")
							time.sleep(3)
						else:
							print("nochma Fail")
							exit()
	
	print("Finished")

if __name__ == '__main__':main()