<html>
<head>
<title>Administration</title>
</head>
<body>
<h1>Administration</h1>
<%
    items = [['Add rock', 'addrock'], ['Add figure', 'addfigure'], ['Update coordinates', 'updatecoordinates']]
%>
<ol>
% for item in items:
    <li><a href='/administration/${item[1]}'>${item[0]}</a></li>
% endfor
</ol>
</body>
</html>