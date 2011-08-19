import logging

from pylons import request, response, session, tmpl_context as c, url
from pylons.controllers.util import abort, redirect

from petroglyphsmap.lib.base import BaseController, render

log = logging.getLogger(__name__)

class AdministrationController(BaseController):

    def index(self):
        # Return a rendered template
        #return render('/administration.mako')
        # or, return a string
        return render('/administration/index.mako')
    
    def addrock(self):
        return render('/administration/addrock.mako')
    
    def addfigure(self):
        return render('/administration/addfigure.mako')
    
    def updatecoordinates(self):
        return render('/administration/updatecoordinates.mako')
        
    def addrockquery(self):
        c.rocknumber = request.params['rocknumber']
        c.groupnumber = request.params['groupnumber']
        c.zonenumber = request.params['zonenumber']
        return render('/administration/addrockquery.mako')
        
    def addfigurequery(self):
        c.figurenumber = request.params['figurenumber']
        c.rocknumber = request.params['rocknumber']
        c.groupnumber = request.params['groupnumber']
        c.zonenumber = request.params['zonenumber']
        return render('/administration/addfigurequery.mako')

