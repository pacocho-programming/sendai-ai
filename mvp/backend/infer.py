from flask import Flask, request, jsonify
from ultralytics import YOLO
from PIL import Image
import io


app = 