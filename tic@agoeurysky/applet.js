const Applet = imports.ui.applet;
const Util = imports.misc.util;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const Soup = imports.gi.Soup;
const Settings = imports.ui.settings;
const UUID = "tic@agoeurysky";

const ICON_GREEN = "/assets/flag-green.svg";
const ICON_BLUE = "/assets/flag-blue.svg";
const ICON_YELLOW = "/assets/flag-yellow.svg";
const ICON_RED = "/assets/flag-red.svg";

function MyApplet(metadata, orientation, panel_height, instance_id) {
    this._init(metadata, orientation, panel_height, instance_id);
}

MyApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    _init: function(metadata, orientation, panel_height, instance_id) {
        Applet.TextIconApplet.prototype._init.call(this, orientation, panel_height, instance_id);

        this.settings = new Settings.AppletSettings(this, UUID, this.instance_id);
        this.settings.bindProperty(Settings.BindingDirection.IN, "update-interval", "update_interval", this._new_freq, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "json-uri", "json_uri", null, null);

        this.metadata = metadata;

        this.set_applet_icon_name("battery");

        this.httpSession = new Soup.Session();

        this._update_loop();
    },

    _new_freq: function(){
        if (this._updateLoopID) {
			Mainloop.source_remove(this._updateLoopID);
		}
        this._update_loop();
    },
    
    on_applet_removed_from_panel: function () {
    // stop the loop when the applet is removed
	    if (this._updateLoopID) {
		    Mainloop.source_remove(this._updateLoopID);
	    }

    },

    _get_status: function(){
        var self = this;
        let message = Soup.Message.new('GET', this.json_uri);

        this.httpSession.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, function (session, response) {
            if (message.get_status() !== 200) {
                var err = 'Failure to receive valid response from remote api ' + self.json_uri;
                global.logWarning(err);
                self.set_applet_label("... VA")
                self.set_applet_tooltip(err);
                self.set_applet_icon_name("error");
            } else {
		        try {
            		let bytes = session.send_and_read_finish(response);
                    let decoder = new TextDecoder('utf-8');
                    let responseData = decoder.decode(bytes.get_data());

                    var value = self._get_tic_va(responseData);

                    if (value < 500) {
                        self.set_applet_icon_symbolic_path(self.metadata.path + ICON_GREEN);
                    } else if (value < 1000) {
                        self.set_applet_icon_symbolic_path(self.metadata.path + ICON_BLUE);
                    } else if (value < 3000) {
                        self.set_applet_icon_symbolic_path(self.metadata.path + ICON_YELLOW);
                    } else {
                        self.set_applet_icon_symbolic_path(self.metadata.path + ICON_RED);
                    }
                    
                    self.set_applet_tooltip(_("PAPP value"));
                    self.set_applet_label(value + " VA");
		        }

		        catch (error) {
			        global.logWarning("ERROR " + error);
		        }
            }
        });
    },

    _get_tic_va: function(jsonResponse) {
        const ticObject = JSON.parse(jsonResponse);
        return ticObject.PAPP;
    },

    _update_loop: function () {
       this._get_status();
       this._updateLoopID = Mainloop.timeout_add(this.update_interval, Lang.bind(this, this._update_loop));
    }
};

function main(metadata, orientation, panel_height, instance_id) {
    return new MyApplet(metadata, orientation, panel_height, instance_id);
}
