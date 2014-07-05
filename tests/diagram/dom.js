(function() {
    var tolerance = 0.0001,
        dataviz = kendo.dataviz,
        Point = dataviz.diagram.Point,
        Rect = dataviz.diagram.Rect,
        Geometry = dataviz.diagram.Geometry,
        diagram;

    function createDiagram(options) {
        QUnit.fixture.html('<div id="canvas" />');
        diagram = $("#canvas").kendoDiagram(options).getKendoDiagram();
    }

    function setup() {
        createDiagram();
    }

    function teardown() {
        diagram.destroy();
    }

    // ------------------------------------------------------------
    module("Diagram", {
        setup: setup,
        teardown: teardown
    });

    test("Diagram should have default theme", function () {
        equal(diagram.options.theme, "default");
    });

    test("sets position relative, tabindex and widget classes to element", function () {
        var element = diagram.element;
        equal(element.attr("tabindex"), 0);
        equal(element.css("position"), "relative");
        ok(element.hasClass("k-widget"));
        ok(element.hasClass("k-diagram"));
    });

    test("creates canvas container with class k-layer", function () {
        equal(diagram.element.find(".k-layer").length, 1);
    });

    // ------------------------------------------------------------
    module("Diagram / add shape", {
        setup: function() {
            createDiagram();
            diagram.addShape({
                id: "TestShape",
                data: "rectangle",
                width: 200, height: 100,
                background: "#778899",
                x: 100,
                y: 120
            });
        },
        teardown: teardown
    });

    test("adds shape to shapes", function() {
        equal(diagram.shapes.length, 1);
    });

    test("appends shape to main layer", function() {
        var shape = diagram.shapes[0];
        ok($.inArray(shape.visual.drawingContainer(), diagram.mainLayer.drawingContainer().children) >= 0);
    });

    test("shape has 5 connectors by default", function() {
        equal(diagram.shapes[0].connectors.length, 5);
    });

    test("sets shape id", function() {
        equal(diagram.shapes[0].options.id, "TestShape");
    });

    // ------------------------------------------------------------
    (function() {
        var shape;

        function setupShapeDefaults(shapeDefaults) {
            createDiagram({
                shapeDefaults: shapeDefaults
            });
        }

        module("Diagram / shapeDefaults", {
            teardown: teardown
        });

        test("default shape type", function() {
            setupShapeDefaults({type: "circle"});
            shape = diagram.addShape({id: "shape1"});

            equal("circle", shape.options.type, "the type of the shape should come from shapeDefaults");
        });

        test("default shape path", function() {
            setupShapeDefaults({path: "m0,100 L100,100 L50,0z"});
            shape = diagram.addShape({id: "shape1"});

            equal("m0,100 L100,100 L50,0z", shape.options.path, "path should be set by the shapeDefaults");
        });

        test("shape is undoable", function() {
            setupShapeDefaults({});
            shape = diagram.addShape({id: "shape1"});

            equal(shape, diagram.undoRedoService.stack[0].shape, "shape is undoable");
        });
    })();

    // ------------------------------------------------------------
    module("Diagram / add connection", {
        setup: setup,
        teardown: teardown
    });

    test("connect adds connections", function () {
        var shape1 = AddShape(diagram, new Point(100, 120),
            kendo.deepExtend(Shapes.SequentialData, {
                width: 80, height: 80, title: "sequential data"
            }));
        var shape2 = AddShape(diagram, new Point(100, 400));
        var shape3 = AddShape(diagram, new Point(370, 400), Shapes.Wave);

        var topCor = shape2.getConnector("Top");
        var topCor2 = shape3.getConnector("Top");
        var bottomCor = shape1.getConnector("Bottom");
        var con = diagram.connect(bottomCor, topCor, {
            startCap: "ArrowEnd",
            endCap: "FilledCircle"
        });
        var con2 = diagram.connect(bottomCor, topCor2);
        equal(diagram.connections.length, 2, "diagram should have 2 connections");
    });

    // ------------------------------------------------------------
    (function() {
        var rect;
        var shape;
        var newPan;
        var viewport;

        module("Diagram / bring into view", {
            setup: function (){
                setup();
                viewport = diagram.viewport();
            },
            teardown: teardown
        });

        test("rectangle", function () {
            rect = new Rect(0, 0, 400, 400);
            diagram.bringIntoView(rect);
            newPan = new Point(viewport.width / 2, viewport.height / 2).minus(rect.center());
            deepEqual(diagram.pan(), newPan);
        });

        test("shape", function () {
            shape = diagram.addShape({});
            rect = shape.bounds();

            diagram.bringIntoView(shape, {align: "none"});
            deepEqual(diagram.pan(), new Point(), "Shape is in view. No need to bring anything.");

            diagram.bringIntoView(shape);
            newPan = new Point(viewport.width / 2, viewport.height / 2).minus(rect.center());
            deepEqual(diagram.pan(), newPan);

        });

        test("multiple shapes", function () {
            shape = diagram.addShape({});
            var point = new Point(500, 500);
            var shape1 = diagram.addShape({
                x: point.x,
                y: point.y
            });

            rect = shape.bounds().union(shape1.bounds());

            diagram.bringIntoView([shape, shape1], {center: true});
            newPan = new Point(viewport.width / 2, viewport.height / 2).minus(rect.center());
            deepEqual(diagram.pan(), newPan);
        });

        test("align top right", function () {
            shape = diagram.addShape({});
            rect = shape.bounds("transformed");

            newPan = viewport.topRight().minus(rect.topRight()).plus(diagram.pan());
            diagram.bringIntoView([shape], {align: "top right"});
            equal(diagram.pan().x, Math.floor(newPan.x));
            equal(diagram.pan().y, Math.floor(newPan.y));
        });

        test("align center bottom", function () {
            shape = diagram.addShape({});
            rect = shape.bounds("transformed");

            newPan = viewport.bottom().minus(rect.bottom()).plus(diagram.pan());
            diagram.bringIntoView([shape], {align: "center bottom"});
            equal(diagram.pan().x, newPan.x);
            equal(diagram.pan().y, newPan.y);
        });
    })();

    // ------------------------------------------------------------
    (function() {
        module("initialization / layout", {
            setup: function() {
                createDiagram({ layout: {
                        grid: {
                            width: 600
                        }
                    }
                });
            },
            teardown: teardown
        });

        test("stores grid layout width option", function () {
            equal(diagram.options.layout.grid.width, 600, "");
        });

        // test("calls layout method", function () {
             // eqaul(diagram.calls("layout"), 1);
        // });
    })();

    // ------------------------------------------------------------
    module("initialization / connections", {
        teardown: teardown
    });

    test("connection is created with 'to' reference to a shape", function() {
        createDiagram({
            shapes: [{id: "s1"}, {id: "s2"}],
            connections: [{
                from: { shapeId: "s1", connector: "auto" },
                to: "s2"
            }]
        });

        equal(diagram.connections.length, 1, "diagram should have a single connection");
        equal(diagram.connections[0].to.shape, diagram.getShapeById("s2"), "the to property should point to the second shape");
    });

    // ------------------------------------------------------------
    (function() {
        module("Shape / types", {
            setup: setup,
            teardown: teardown
        });

        test("create path shape", function() {
            var shape = diagram.addShape({
                id: "pathShape",
                path: "m0,100 L100,100 L50,0z"
            });

            equal(diagram.shapes.length, 1, "should have a single path");
            var path = diagram.shapes[0];
            equal(path.shapeVisual.data(), shape.options.path, "the shape visual should have the same path data");
        });

        test("create image shape", function() {
            var shape = diagram.addShape({
                id: "imageShape",
                type: "image",
                source: "http://demos.telerik.com/kendo-ui/content/web/foods/1.jpg"
            });

            equal(diagram.shapes.length, 1, "should have a single group with rect");
            var imageShape = diagram.shapes[0];
            equal(imageShape.shapeVisual.options.source, "http://demos.telerik.com/kendo-ui/content/web/foods/1.jpg", "the shape visual should have the same image source");
        });

        test("visual template", function() {
            var visualCalled = false,
                shape = diagram.addShape({
                    id: "visualShape",
                    visual: function() {
                        visualCalled = true;
                        return new dataviz.diagram.Group({ id: "shapeRoot" });
                    }
                });

            ok(visualCalled, "visual method should be called");
            equal(diagram.shapes.length, 1, "should have a single shape");
        });

        test("typed shape", function() {
            var shape = diagram.addShape({
                id: "circle",
                type: "circle"
            });

            equal(diagram.shapes.length, 1, "should have a single shape");
            equal(diagram.shapes[0].shapeVisual.options.type, shape.options.type, "shape visual is same type as the shape itself");
        });

        // ------------------------------------------------------------
        module("Shape / Content", {
            setup: setup,
            teardown: teardown
        });

        test("template", function() {
            var shape = diagram.addShape({
                content: {
                    template: "foo"
                }
            });

            equal(shape.options.content.text, "foo");
            equal(shape._contentVisual.content(), "foo");
        });

        test("text", function() {
            var shape = diagram.addShape({
                content: {
                    text: "foo"
                }
            });

            equal(shape.options.content.text, "foo");
            equal(shape._contentVisual.content(), "foo");
        });

        test("aligns text", function() {
            var shape = diagram.addShape({
                content: {
                    text: "foo",
                    align: "center middle"
                },
                type: "rectangle",
                width: 100,
                height: 100
            });
            var content = shape._contentVisual;
            var contentBBox = content.drawingElement.bbox(null);
            var position = content.position();
            close(position.x, (100 - contentBBox.width()) / 2, 1);
            close(position.y, (100 - contentBBox.height()) / 2, 1);
        });

        test("aligns text with transformed visual", function() {
            var shape = diagram.addShape({
                content: {
                    text: "foo",
                    align: "center middle"
                },
                type: "rectangle",
                width: 100,
                height: 100,
                x: 200,
                y: 100,
                rotation: {
                    angle: 30
                }
            });
            var rect = new Rect(0, 0, 200, 200);
            shape.bounds(rect);
            shape.content("foo");
            var content = shape._contentVisual;
            var contentBBox = content.drawingElement.bbox(null);
            var position = content.position();
            close(position.x, (100 - contentBBox.width()) / 2, 1);
            close(position.y, (100 - contentBBox.height()) / 2, 1);
        });

        // ------------------------------------------------------------
        module("Shape / bounds", {
            setup: setup,
            teardown: teardown
        });

        test("inits position", function() {
            var shape = diagram.addShape({
                id: "visualShape",
                type: "rectangle",
                x: 10,
                y: 40
            });
            var bounds = shape.bounds();
            equal(bounds.x, 10);
            equal(bounds.y, 40);
        });

        test("dose not set position to shape visual", function() {
            var shape = diagram.addShape({
                id: "visualShape",
                type: "rectangle",
                x: 10,
                y: 40
            });
            var visual = shape.shapeVisual;
            equal(visual.options.x, 0);
            equal(visual.options.y, 0);
        });

        test("inits width and height based on visual content", function() {
            var shape = diagram.addShape({
                id: "visualShape",
                visual: function() {
                    return new dataviz.diagram.Rectangle({ width: 300, height: 150, stroke: {width: 0}});
                }
            });
            var bounds = shape.bounds();
            equal(bounds.width, 300);
            equal(bounds.height, 150);
        });

        test("inits width and height based on width and height options with predefined type", function() {
            var shape = diagram.addShape({
                type: "rectangle",
                width: 150,
                height: 200,
                stroke: {width: 0}
            });
            var bounds = shape.bounds();
            equal(bounds.width, 150);
            equal(bounds.height, 200);
        });

        // ------------------------------------------------------------
        module("Shape / bounds / redraw", {
            setup: setup,
            teardown: teardown
        });

        // test("redraw sets new position", function() {
            // var shape = diagram.addShape({
                // id: "visualShape",
                // type: "rectangle",
                // x: 10,
                // y: 40
            // });
            // shape.redraw({
                // x: 20,
                // y: 50
            // });
            // var bounds = shape.bounds();
            // equal(bounds.x, 20);
            // equal(bounds.y, 50);
        // });

        // ------------------------------------------------------------
        module("Shape / bounds / events", {
            setup: setup,
            teardown: teardown
        });

        test("itemBoundsChange event is raised after position set", function () {
            var s = diagram.addShape({}),
                raised;

            diagram.bind("itemBoundsChange", function () {
                raised = true;
            });

            s.position(new Point(100, 100));
            ok(raised);
        });

        test("itemBoundsChange event is raised after bounds set", function () {
            var s = diagram.addShape({}),
                raised;

            diagram.bind("itemBoundsChange", function () {
                raised = true;
            });

            s.bounds(new Rect(100, 100, 100, 100));

            ok(raised);
        });


        test("Add shape raises change event", function() {
            var eventShape = null,
                called = false;

            diagram.bind("change", function(args) {
                eventShape = args.added[0];
                called = true;
            });

            var addedShape = diagram.addShape({});
            ok(called, "change event should be raised");
            equal(eventShape, addedShape, "the reported shape should be the same as the added");
        });

        test("Remove shape raises change event", function() {
            var eventShape = null,
                called = false,
                shape = diagram.addShape({});

            diagram.bind("change", function(args) {
                eventShape = args.removed[0];
                called = true;
            });

            diagram.remove(shape);
            ok(called, "change event should be raised");
            equal(eventShape, shape, "the reported shape should be the same as the removed");
        });

        test("Remove multiple items raises change event", function() {
            var eventShapes = [],
                point = new Point(1, 0),
                shapes = [diagram.addShape({}), diagram.addShape({ x: point.x, y: point.y })];

            diagram.bind("change", function(args) {
                eventShapes = args.removed;
            });

            diagram.remove(shapes);
            equal(eventShapes.length, shapes.length, "all shapes should be reported by the event handler");
        });

        // ------------------------------------------------------------
        module("Shape / bounds / zoom", {
            setup: setup,
            teardown: teardown
        });

        test("visual bounds are ok after zoom", function () {
            var s = diagram.addShape({});
            var z = 0.5;
            z = diagram.zoom(z);

            var vb = s.bounds("transformed");
            var b = s.bounds();
            close(b.width, vb.width / z, tolerance);
            close(b.height, vb.height / z, tolerance);
        });
    })();

    // ------------------------------------------------------------
    module("event handling", {
        setup: setup,
        teardown: teardown
    });

    test("limit zoom with min/max values", function () {
        equal(diagram._getValidZoom(0.7), 0.7, "valid, zoom out");
        equal(diagram._getValidZoom(1), 1, "valid, no zoom");
        equal(diagram._getValidZoom(1.4), 1.4, "valid, zoom in");
        equal(diagram._getValidZoom(2), 2, "is max");
        equal(diagram._getValidZoom(2.2), 2, "above max");
    });

    test("zoom does not change the pan", function () {
        var pan = diagram.pan().clone();
        diagram.zoom(1.1);

        ok(pan.equals(diagram.pan()));
    });

    test("zoom at position changes diagram zoom", function () {
        var zoom = diagram.zoom(1.1, new Point(200, 200));
        equal(zoom, 1.1);
    });

    // ------------------------------------------------------------
    module("Coordinate transformations", {
        setup: setup,
        teardown: teardown
    });

    test("transform document point to view point", function() {
        var doc = diagram.element.offset(),
            point = new Point(100, 100);

        var result = diagram.documentToView(point);

        roughlyEqualPoint(result, new Point(point.x - doc.left, point.y - doc.top), "transformed point should be relative to the diagram view");
    });

    test("transform view point to document point", function() {
        var doc = $(diagram.canvas.element).offset(),
            point = new Point(100, 100);

        var result = diagram.viewToDocument(point);

        roughlyEqualPoint(result, new Point(point.x + doc.left, point.y + doc.top), "transformed point should include the diagram container offset");
    });

    test("transform view to layer point", function() {
        var point = new Point(100, 100);
        diagram.zoom(1.5);

        var result = diagram.viewToModel(point);

        roughlyEqualPoint(result, point.times(1/1.5), "view point should correspond to a scaled down vector in the layer");
    });

    test("transform layer to view point", function() {
        var point = new Point(100, 100);
        diagram.zoom(1.5);

        var result = diagram.modelToView(point);

        roughlyEqualPoint(result, point.times(1.5), "layer point should appear as zoomed in the view coordinate system");
    });

    test("transform document to layer", function() {
        var point = new Point(100, 100);
        diagram.zoom(1.5);
        diagram.pan(-20, -20);

        var result = diagram.documentToModel(point);
        var expected = diagram.viewToModel(diagram.documentToView(point));

        roughlyEqualPoint(result, expected, "document to layer transformation should be same as document->view->layer");
    });

    test("transform layer to document", function() {
        var point = new Point(100, 100);
        diagram.zoom(1.5);
        diagram.pan(-20, -20);

        var result = diagram.modelToDocument(point);
        var expected = diagram.viewToDocument(diagram.modelToView(point));

        roughlyEqualPoint(result, expected, "layer->view->document");
    });

    // ------------------------------------------------------------
    module("Connections and connectors", {
        setup: function () {
            QUnit.fixture.html('<div id="canvas" />');
            $("#canvas").kendoDiagram();

            diagram = $("#canvas").getKendoDiagram();
        },
        teardown: function () {
            diagram.destroy();
        }
    });

    test("create connection on init", function() {
        diagram.destroy();
        diagram = $("#canvas").kendoDiagram({
            shapes: [{id: "s1"},{id: "s2"}],
            connections: [{
                from: { shapeId: "s1" },
                to: { shapeId: "s2" }
            }]
        }).getKendoDiagram();

        equal(diagram.connections.length, 1, "one connection should be created");

        var connection = diagram.connections[0],
            source = connection.source(),
            target = connection.target();

        equal(source.shape.id, "s1", "source should be the from shape");
        equal(target.shape.id, "s2", "target should be the to shape");
    });

    test("connections init with specific connector", function() {
        diagram.destroy();
        diagram = $("#canvas").kendoDiagram({
            shapes: [{
                id: "s1"
            },{
                id: "s2"
            }],
            connections: [{
                from: {
                    shapeId: "s1",
                    connector: "bottom"
                },
                to: {
                    shapeId: "s2",
                    connector: "top"
                }
            }]
        }).getKendoDiagram();

        var connection = diagram.connections[0],
            source = connection.source(),
            target = connection.target();

        equal(source.options.name, "Bottom", "source connector is specific");
        equal(target.options.name, "Top", "target connector is specific");
    });

    test("Connection connect - set auto connectors test", function () {
        var s1 = diagram.addShape({});
        var point = new Point(100, 0);
        var s2 = diagram.addShape({ x: point.x, y: point.y });

        var c1 = diagram.connect(s1, s2);
        equal(c1.sourceConnector.options.name, "Auto");
        equal(c1.targetConnector.options.name, "Auto");
    });

    test("Connection connect - resolve auto connectors test", function () {
        var s1 = diagram.addShape({});
        var point = new Point(100, 0);
        var s2 = diagram.addShape({ x: point.x, y: point.y });

        var c1 = diagram.connect(s1, s2);
        equal(c1._resolvedSourceConnector.options.name, "Right");
        equal(c1._resolvedTargetConnector.options.name, "Left");
    });

    test("Connection connect - resolve auto connectors border test", function () {
        var point1 = new Point(100, 100);
        var s1 = diagram.addShape({ x: point1.x, y: point1.y });
        var point2 = new Point(160, 160);
        var s2 = diagram.addShape({ x: point2.x, y: point2.y });

        var c1 = diagram.connect(s1, s2);
        equal(c1._resolvedSourceConnector.options.name, "Bottom");
        equal(c1._resolvedTargetConnector.options.name, "Left");
    });

    test("Connection connect - resolve auto connectors after move test", function () {
        var point1 = new Point(100, 100);
        var s1 = diagram.addShape({ x: point1.x, y: point1.y });
        var point2 = new Point(160, 160);
        var s2 = diagram.addShape({ x: point2.x, y: point2.y });

        var c1 = diagram.connect(s1, s2);
        equal(c1._resolvedSourceConnector.options.name, "Bottom");
        equal(c1._resolvedTargetConnector.options.name, "Left");

        s2.position(new Point(300, 100));
        c1.refresh();
        equal(c1._resolvedSourceConnector.options.name, "Right");
        equal(c1._resolvedTargetConnector.options.name, "Left");
    });

    test("Connection detach", function () {
        var s1 = diagram.addShape({});
        var point2 = new Point(200, 0);
        var s2 = diagram.addShape({ x: point2.x, y: point2.y });

        var c1 = diagram.connect(s1, s2);
        c1.select(true);
        diagram.toolService.start(s2.bounds().left());

        ok(c1.adorner, "The connection edit adorner is present");
        ok(diagram.toolService.activeTool.type === "ConnectionTool", "The active tool is ConnectionEditTool");

        diagram.toolService.move(new Point(400, 0));
        diagram.toolService.end(new Point(400, 0));

        //ok(c1._resolvedTargetConnector === undefined);
        //ok(c1.targetConnector === undefined);

        equal(c1._resolvedSourceConnector.options.name, "Right");
        equal(c1.sourceConnector.options.name, "Auto");
    });

    test('Connection definers', function () {
        var con = new dataviz.diagram.Connection(new Point(10, 20), new Point(100, 200));
        con.points([new Point(1, 2), new Point(3, 4), new Point(5, 6)]);
        equal(con.points().length, 3);
        equal(con.allPoints().length, 5);
        ok(con.sourceDefiner().point === con.sourcePoint());
        ok(con.targetDefiner().point === con.targetPoint());

        con.sourceDefiner(new dataviz.diagram.PathDefiner(new Point(44, 55), new Point(478, 44), new Point(-55, 0)));
        ok(con.sourceDefiner().point.x === 44 && con.sourceDefiner().point.y === 55);
        ok(con.sourceDefiner().left===null);
        ok(con.sourceDefiner().right.x === -55 && con.sourceDefiner().right.y === 0);

        con.targetDefiner(new dataviz.diagram.PathDefiner(new Point(44, 55), new Point(478, 102), new Point(-55, 0)));
        ok(con.targetDefiner().point.x === 44 && con.targetDefiner().point.y === 55);
        ok(con.targetDefiner().right===null);
        ok(con.targetDefiner().left.x === 478 && con.targetDefiner().left.y === 102);
    });

    test('Connection bounds', function () {
        var con = new dataviz.diagram.Connection(new Point(0, 0), new Point(500, 500));
        con.points([new Point(25,10), new Point(101,88), new Point(250,37), new Point(100,100), new Point(301,322), new Point(660,770)]);
        var bounds = con._router.getBounds();
        ok(bounds.x===0 && bounds.y===0 && bounds.width===660 && bounds.height===770);
    });

    test('Distance to a line segment', function () {
        var d = Geometry.distanceToLine(new Point(0,0), new Point(0,100), new Point(100,100));
        equal(d, 100);
        d = Geometry.distanceToLine(new Point(57.88, 0), new Point(0, 100), new Point(100, 100));
        equal(d,100);
        d = Geometry.distanceToLine(new Point(100, 44.02), new Point(0, 0), new Point(0, 100));
        equal(d,100);
    });

    test('Distance to polyline', function () {
        var polyline = [new Point(0,0), new Point(100,0), new Point(100,100), new Point(0,100)];
        var d = Geometry.distanceToPolyline(new Point(50,50), polyline);
        equal(d, 50);
        d = Geometry.distanceToPolyline(new Point(57,50), polyline);
        equal(d, 43);
    });

    // ------------------------------------------------------------
    module("Serialization - Cut/Copy/Paste", {
        setup: function () {
            QUnit.fixture.html('<div id="canvas" />');
            $("#canvas").kendoDiagram();

            d = $("#canvas").getKendoDiagram();
            randomDiagram(d);
        },
        teardown: function () {
            d.destroy();
        }
    });

    test("Copy Selected", function () {
        var s1 = d.shapes[0];

        s1.select(true);
        equal(d._clipboard.length, 0);
        d.copy();
        equal(d._clipboard.length, 1);
    });

    test("Copy and Paste", function () {
        var shapesCount = d.shapes.length;
        var s1 = d.shapes[0];

        s1.select(true);
        equal(d._clipboard.length, 0);
        d.copy();
        equal(d._clipboard.length, 1);
        d.paste();
        equal(shapesCount + 1, d.shapes.length);
    });

    test("Cut and Paste", function () {
        var shapesCount = d.shapes.length;
        var s1 = d.shapes[0];

        s1.select(true);
        equal(d._clipboard.length, 0);
        d.cut();
        equal(d._clipboard.length, 1);
        equal(shapesCount - 1, d.shapes.length);
        d.paste();
        equal(shapesCount, d.shapes.length);
    });

    test("Cut and Paste - positions", function () {
        var shapesCount = d.shapes.length;
        var s1 = d.shapes[0];
        var pos = s1.position().clone();

        s1.select(true);
        d.cut();
        d.paste();
        var copied = d.shapes[d.shapes.length - 1];
        deepEqual(copied.position(), pos);
    });


    test("Copy and Paste - positions", function () {
        var shapesCount = d.shapes.length;
        var s1 = d.shapes[0];
        var pos = s1.position().clone();

        s1.select(true);
        d.copy();
        d.paste();
        var copied = d.shapes[d.shapes.length - 1];
        pos = pos.plus(new Point(d.options.copy.offsetX, d.options.copy.offsetY));
        deepEqual(copied.position(), pos);

        d.paste();
        copied = d.shapes[d.shapes.length - 1];
        pos = pos.plus(new Point(d.options.copy.offsetX, d.options.copy.offsetY));
        deepEqual(copied.position(), pos);
    });

    test("Copy - copying the options", function () {
        var shapesCount = d.shapes.length;
        var s1 = d.shapes[0];
        var copy = s1.clone();
        ok(copy.id!==s1.id && copy.options.id!==s1.options.id);
        copy.options.id = s1.options.id;
        deepEqual(copy.options, s1.options);
    });

    test("Copy connection", function () {
        var c1 = d.connect(d.shapes[0], d.shapes[1]);

        var copy = c1.clone();

        deepEqual(copy.options, c1.options);
        deepEqual(copy.from, c1.from);
        deepEqual(copy.to, c1.to);
    });

    test("Copy/Paste connection", function () {
        var c1 = d.connect(d.shapes[0], d.shapes[1]);
        var cons = d.connections.length;

        c1.select(true);
        equal(d._clipboard.length, 0);
        d.copy();
        equal(d._clipboard.length, 1);
        d.paste();
        equal(cons + 1, d.connections.length);
    });

    test("Cut/Paste connection", function () {
        var c1 = d.connect(d.shapes[0], d.shapes[1]);
        var cons = d.connections.length;

        c1.select(true);
        equal(d._clipboard.length, 0);
        d.cut();
        equal(d._clipboard.length, 1);
        d.paste();
        equal(cons, d.connections.length);
    });
})();
