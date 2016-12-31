/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.mycompany.geocode;

import com.google.maps.GeoApiContext;
import com.google.maps.GeocodingApi;
import com.google.maps.GeocodingApiRequest;
import com.google.maps.model.GeocodingResult;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;


public class GeoCoding 
{
    
    private static String[] keys;
    private static int keyNumber = 19;
    
    private static GeoApiContext context = new GeoApiContext();
    private static int z = 0;
    
    private static File geoResults = new File("D://BA/database/data/restaurants/geoResult4.txt");
    private static File geoFails = new File("D://BA/database/data/restaurants/geoFails.txt");
    
	
    private static void getKeys()
    {
        BufferedReader br;
        keys = new String[keyNumber];
        
        try
        {
            br = new BufferedReader(new FileReader("D://BA/database/data/restaurants/keys.txt"));
            
            for(int i=0; i<keyNumber; i++)
            {
               keys[i] = br.readLine();
            }
            br.close();
        }
        catch(IOException ex)
        {
            ex.printStackTrace();
        }
        for(int i=0; i<keys.length; i++)
        {
            System.out.println("["+i+"] -"+keys[i]);
        }
    }
    
    public static void geoCoding(String id, String street, String zip) 
    {
        GeocodingResult[] results;
        String search = street + zip;
        
            try
            {
                results = GeocodingApi.geocode(context, search+" NY").await();
                
                System.out.println("+ "+id);
                String append = id +";"+results[0].geometry.location.lat+";"+results[0].geometry.location.lng+"\n";
                
                try 
                {
                    PrintWriter output = new PrintWriter(new FileWriter(geoResults, true));
                    output.append(append);
                    output.close();
                } 
                catch (Exception e) {e.printStackTrace();}
                
            }
            catch(java.lang.ArrayIndexOutOfBoundsException e)
            {
				// no results was returned for the GeoCoder
                System.out.println("### Array OO Bounds"+id);
                try 
                {
                    PrintWriter output = new PrintWriter(new FileWriter(geoFails, true));
                    output.append(id +"\n");
                    output.close();
                } 
                catch (Exception ex) {}
            }
            catch(Exception e)
            {
				// in case key got invalid switch to next
                int znew = (z+ 1) % keyNumber;
                try 
                {
                    PrintWriter output = new PrintWriter(new FileWriter(geoFails, true));
                    output.append("#### key switch : "+z+ " - "+znew+ "  +"+id +"\n");
                    output.close();
                } 
                catch (Exception ex) {}
                z = znew;
                context.setApiKey(keys[z]);
            }
    }
    
    public static void readFile()
    {
        String id;
        String street;
        String zip;
        
        BufferedReader br;
   
             try
             {
                    br= new BufferedReader(new FileReader("D://BA/database/data/restaurants/data2.txt"));
                  
                     for(int j=0; j<3999; j++)
                    {
                         String line = br.readLine();
                       
                             // read the text file with the restaurant addresses

                        String[] res = line.split(";");
                        id = res[0];
                        street = res[2];
                        zip = res[1];

                        geoCoding(id, street, zip);
               
                    }
                     br.close();
             }
            catch(IOException ex)
            {
                ex.printStackTrace();
            }
    }
    
    public static void main(String args[])
    {
        getKeys();
        
        context.setApiKey(keys[z]);
        
        readFile();       
    }
}