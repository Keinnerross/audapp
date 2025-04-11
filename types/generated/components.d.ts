import type { Schema, Struct } from '@strapi/strapi';

export interface InformesBaseInforme extends Struct.ComponentSchema {
  collectionName: 'components_informes_base_informes';
  info: {
    description: '';
    displayName: 'base_informe';
    icon: 'puzzle';
  };
  attributes: {
    auditor: Schema.Attribute.Relation<'oneToOne', 'api::auditor.auditor'>;
    empresa: Schema.Attribute.Relation<'oneToOne', 'api::empresa.empresa'>;
    fecha_informe: Schema.Attribute.Date;
    informe: Schema.Attribute.Relation<'oneToOne', 'api::informe.informe'>;
    nombre_informe: Schema.Attribute.String;
  };
}

export interface InformesRequerimiento extends Struct.ComponentSchema {
  collectionName: 'components_informes_requerimientos';
  info: {
    description: '';
    displayName: 'requerimientos';
    icon: 'pin';
  };
  attributes: {
    archivos: Schema.Attribute.Media<'images' | 'files' | 'videos', true>;
    calificacion: Schema.Attribute.Enumeration<
      ['cumple', 'no cumple', 'oportunidad de mejora', 'no aplica']
    >;
    comentario: Schema.Attribute.Text;
    nombre_requerimiento: Schema.Attribute.Text;
    recomendacion: Schema.Attribute.Text;
  };
}

export interface InformesResumenInforme extends Struct.ComponentSchema {
  collectionName: 'components_informes_resumen_informes';
  info: {
    description: '';
    displayName: 'resumen_informe';
    icon: 'puzzle';
  };
  attributes: {
    calificacion: Schema.Attribute.Enumeration<
      ['conforme', 'no conforme', 'con observaciones', 'no aplica']
    >;
    observaciones: Schema.Attribute.Text;
    requerimiento: Schema.Attribute.Component<'informes.requerimiento', true>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'informes.base-informe': InformesBaseInforme;
      'informes.requerimiento': InformesRequerimiento;
      'informes.resumen-informe': InformesResumenInforme;
    }
  }
}
