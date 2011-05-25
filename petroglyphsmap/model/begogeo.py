from sqlalchemy import *
from sqlalchemy.orm import *
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from geoalchemy import *

engine = create_engine('postgresql://postgres:postgres@localhost/postgres', echo=True)
session = sessionmaker(bind=engine)

metadata = MetaData(engine)
begogeo = declarative_base(metadata=metadata)

class Zone(begogeo):
    __tablename__ = 'zone'
    zone = Column(Integer, primary_key=True)
    geo_poly = GeometryColumn(Polygon(2))
    geo_centro = GeometryColumn(Point(2))

class Group(begogeo):
    __tablename__ = 'group'
    group_id = Column(Integer, primary_key=True)
    group = Column(Integer, nullable=False)
    zone_id = Column(Integer, ForeignKey('zone.zone'))
    geo_poly = GeometryColumn(Polygon(2))
    geo_centro = GeometryColumn(Point(2))

class Rock(begogeo):
    __tablename__ = 'rock'
    rock_id = Column(Integer, primary_key=True)
    rock = Column(Unicode(10), nullable=False)
    group_id = Column(Integer, ForeignKey('group.group_id'))
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    z = Column(Float)
    geo_point = GeometryColumn(Point(2))    

class Figure(begogeo):
    __tablename__ = 'figure'
    figure_id = Column(Integer, primary_key=True)
    figure = Column(Unicode(5), nullable=False)
    rock_id = Column(Integer, ForeignKey('rock.rock_id'))
    identite = Column(Unicode(30), index=True)
    code2 = Column(Unicode(30), index=True)

GeometryDDL(Zone.__table__)
GeometryDDL(Group.__table__)
GeometryDDL(Rock.__table__)

metadata.drop_all()   # comment this on first occassion
metadata.create_all()